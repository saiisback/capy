module capy::capy {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INVITATION_NOT_FOUND: u64 = 3;
    const E_INVITATION_ALREADY_ACCEPTED: u64 = 4;
    const E_INVITATION_ALREADY_REJECTED: u64 = 5;
    const E_NOT_AUTHORIZED: u64 = 6;
    const E_COPARENT_PAIR_EXISTS: u64 = 7;
    const E_INVALID_ADDRESS: u64 = 8;
    const E_INSUFFICIENT_BALANCE: u64 = 9;
    const E_ITEM_NOT_FOUND: u64 = 10;
    const E_ITEM_ALREADY_OWNED: u64 = 11;
    const E_INVALID_ITEM_TYPE: u64 = 12;
    const E_REWARD_ALREADY_CLAIMED: u64 = 13;
    const E_INVALID_GAME_SCORE: u64 = 14;

    // Structs
    struct Invitation has store, copy, drop {
        id: u64,
        from: address,
        to: address,
        status: u8, // 0: pending, 1: accepted, 2: rejected
        created_at: u64,
        accepted_at: u64,
    }

    struct CoParentPair has store, copy, drop {
        id: u64,
        parent1: address,
        parent2: address,
        pet_created: bool,
        created_at: u64,
    }

    // Marketplace item types
    const ITEM_TYPE_FOOD: u8 = 1;
    const ITEM_TYPE_TOY: u8 = 2;
    const ITEM_TYPE_FURNITURE: u8 = 3;
    const ITEM_TYPE_DECORATION: u8 = 4;

    struct MarketplaceItem has store, copy, drop {
        id: u64,
        name: vector<u8>,
        item_type: u8,
        price: u64,
        description: vector<u8>,
        image_url: vector<u8>,
        available: bool,
    }

    struct UserInventory has key, store {
        owned_items: Table<u64, bool>,
        total_items: u64,
    }

    struct GameReward has store, copy, drop {
        id: u64,
        user: address,
        game_type: vector<u8>,
        score: u64,
        reward_amount: u64,
        claimed: bool,
        created_at: u64,
    }

    struct RewardPool has key {
        total_rewards: u64,
        claimed_rewards: u64,
        game_rewards: Table<u64, GameReward>,
        next_reward_id: u64,
    }

    struct CapyData has key {
        invitations: Table<u64, Invitation>,
        co_parent_pairs: Table<u64, CoParentPair>,
        user_invitations: Table<address, vector<u64>>,
        user_pairs: Table<address, vector<u64>>,
        next_invitation_id: u64,
        next_pair_id: u64,
        // Marketplace
        marketplace_items: Table<u64, MarketplaceItem>,
        next_item_id: u64,
        user_inventory: Table<address, UserInventory>,
        // Rewards
        user_rewards: Table<address, vector<u64>>,
        next_reward_id: u64,
    }

    // Global state for invitations that don't require sender initialization
    struct GlobalInvitations has key {
        invitations: Table<u64, Invitation>,
        user_invitations: Table<address, vector<u64>>,
        next_invitation_id: u64,
    }

    #[event]
    struct InvitationSentEvent has store, drop {
        invitation_id: u64,
        from: address,
        to: address,
        timestamp: u64,
    }

    #[event]
    struct InvitationAcceptedEvent has store, drop {
        invitation_id: u64,
        from: address,
        to: address,
        timestamp: u64,
    }

    #[event]
    struct InvitationRejectedEvent has store, drop {
        invitation_id: u64,
        from: address,
        to: address,
        timestamp: u64,
    }

    #[event]
    struct CoParentPairCreatedEvent has store, drop {
        pair_id: u64,
        parent1: address,
        parent2: address,
        timestamp: u64,
    }

    #[event]
    struct ItemPurchasedEvent has store, drop {
        buyer: address,
        item_id: u64,
        item_name: vector<u8>,
        price: u64,
        timestamp: u64,
    }

    #[event]
    struct GameRewardClaimedEvent has store, drop {
        user: address,
        reward_id: u64,
        game_type: vector<u8>,
        score: u64,
        reward_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct PetFedEvent has store, drop {
        user: address,
        pair_id: u64,
        food_item_id: u64,
        happiness_increase: u64,
        timestamp: u64,
    }


    // Initialize the module
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<CapyData>(account_addr), E_ALREADY_INITIALIZED);
        
        move_to(account, CapyData {
            invitations: table::new(),
            co_parent_pairs: table::new(),
            user_invitations: table::new(),
            user_pairs: table::new(),
            next_invitation_id: 1,
            next_pair_id: 1,
            marketplace_items: table::new(),
            next_item_id: 1,
            user_inventory: table::new(),
            user_rewards: table::new(),
            next_reward_id: 1,
        });
    }

    // Initialize global invitations (called once by module owner)
    public entry fun initialize_global_invitations(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<GlobalInvitations>(account_addr), E_ALREADY_INITIALIZED);
        
        move_to(account, GlobalInvitations {
            invitations: table::new(),
            user_invitations: table::new(),
            next_invitation_id: 1,
        });
    }

    // Send invitation to another user - no signature required from sender
    public entry fun send_invitation(account: &signer, from_address: address, to_address: address) acquires GlobalInvitations {
        assert!(to_address != from_address, E_INVALID_ADDRESS);
        
        // Get the global invitations state (stored at module address)
        // The module address should be @capy, not the signer's address
        let global_invitations = borrow_global_mut<GlobalInvitations>(@capy);
        let invitation_id = global_invitations.next_invitation_id;
        
        // Create invitation
        let invitation = Invitation {
            id: invitation_id,
            from: from_address,
            to: to_address,
            status: 0, // pending
            created_at: timestamp::now_microseconds(),
            accepted_at: 0,
        };
        
        // Store invitation in global state
        table::add(&mut global_invitations.invitations, invitation_id, invitation);
        
        // Add to sender's invitation list
        if (!table::contains(&global_invitations.user_invitations, from_address)) {
            table::add(&mut global_invitations.user_invitations, from_address, vector::empty());
        };
        let sender_invitations = table::borrow_mut(&mut global_invitations.user_invitations, from_address);
        vector::push_back(sender_invitations, invitation_id);
        
        // Add to receiver's invitation list  
        if (!table::contains(&global_invitations.user_invitations, to_address)) {
            table::add(&mut global_invitations.user_invitations, to_address, vector::empty());
        };
        let receiver_invitations = table::borrow_mut(&mut global_invitations.user_invitations, to_address);
        vector::push_back(receiver_invitations, invitation_id);
        
        // Increment invitation ID
        global_invitations.next_invitation_id = global_invitations.next_invitation_id + 1;
        
        // Emit event
        event::emit(InvitationSentEvent {
            invitation_id,
            from: from_address,
            to: to_address,
            timestamp: timestamp::now_microseconds(),
        });
    }

    // Accept invitation - updated to use GlobalInvitations and auto-initialize user
    public entry fun accept_invitation(account: &signer, invitation_id: u64) acquires GlobalInvitations, CapyData {
        let account_addr = signer::address_of(account);
        
        // Initialize user if not already initialized
        if (!exists<CapyData>(account_addr)) {
            move_to(account, CapyData {
                invitations: table::new(),
                co_parent_pairs: table::new(),
                user_invitations: table::new(),
                user_pairs: table::new(),
                next_invitation_id: 1,
                next_pair_id: 1,
                marketplace_items: table::new(),
                next_item_id: 1,
                user_inventory: table::new(),
                user_rewards: table::new(),
                next_reward_id: 1,
            });
        };
        
        // Get global invitations
        let global_invitations = borrow_global_mut<GlobalInvitations>(@capy);
        assert!(table::contains(&global_invitations.invitations, invitation_id), E_INVITATION_NOT_FOUND);
        
        let invitation = table::borrow_mut(&mut global_invitations.invitations, invitation_id);
        assert!(invitation.to == account_addr, E_NOT_AUTHORIZED);
        assert!(invitation.status == 0, E_INVITATION_ALREADY_ACCEPTED);
        
        // Get user's CapyData for creating co-parent pairs
        let capy_data = borrow_global_mut<CapyData>(account_addr);
        
        // Update invitation status
        invitation.status = 1; // accepted
        invitation.accepted_at = timestamp::now_microseconds();
        
        // Create co-parent pair
        let pair_id = capy_data.next_pair_id;
        let co_parent_pair = CoParentPair {
            id: pair_id,
            parent1: invitation.from,
            parent2: account_addr,
            pet_created: true,
            created_at: timestamp::now_microseconds(),
        };
        
        // Store co-parent pair
        table::add(&mut capy_data.co_parent_pairs, pair_id, co_parent_pair);
        
        // Add to both users' pair lists
        if (!table::contains(&capy_data.user_pairs, invitation.from)) {
            table::add(&mut capy_data.user_pairs, invitation.from, vector::empty());
        };
        if (!table::contains(&capy_data.user_pairs, account_addr)) {
            table::add(&mut capy_data.user_pairs, account_addr, vector::empty());
        };
        
        let parent1_pairs = table::borrow_mut(&mut capy_data.user_pairs, invitation.from);
        vector::push_back(parent1_pairs, pair_id);
        
        let parent2_pairs = table::borrow_mut(&mut capy_data.user_pairs, account_addr);
        vector::push_back(parent2_pairs, pair_id);
        
        // Increment pair ID
        capy_data.next_pair_id = capy_data.next_pair_id + 1;
        
        // Emit events
        event::emit(InvitationAcceptedEvent {
            invitation_id,
            from: invitation.from,
            to: account_addr,
            timestamp: timestamp::now_microseconds(),
        });
        
        event::emit(CoParentPairCreatedEvent {
            pair_id,
            parent1: invitation.from,
            parent2: account_addr,
            timestamp: timestamp::now_microseconds(),
        });
    }

    // Reject invitation
    public entry fun reject_invitation(account: &signer, invitation_id: u64) acquires GlobalInvitations {
        let account_addr = signer::address_of(account);
        
        // Get global invitations
        let global_invitations = borrow_global_mut<GlobalInvitations>(@capy);
        assert!(table::contains(&global_invitations.invitations, invitation_id), E_INVITATION_NOT_FOUND);
        
        let invitation = table::borrow_mut(&mut global_invitations.invitations, invitation_id);
        assert!(invitation.to == account_addr, E_NOT_AUTHORIZED);
        assert!(invitation.status == 0, E_INVITATION_ALREADY_REJECTED);
        
        // Update invitation status
        invitation.status = 2; // rejected
        
        // Emit event
        event::emit(InvitationRejectedEvent {
            invitation_id,
            from: invitation.from,
            to: account_addr,
            timestamp: timestamp::now_microseconds(),
        });
    }

    // View functions
    public fun get_invitation(capy_addr: address, invitation_id: u64): Invitation acquires GlobalInvitations {
        let global_invitations = borrow_global<GlobalInvitations>(capy_addr);
        assert!(table::contains(&global_invitations.invitations, invitation_id), E_INVITATION_NOT_FOUND);
        *table::borrow(&global_invitations.invitations, invitation_id)
    }

    public fun get_coparent_pair(capy_addr: address, pair_id: u64): CoParentPair acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        assert!(table::contains(&capy_data.co_parent_pairs, pair_id), E_INVITATION_NOT_FOUND);
        *table::borrow(&capy_data.co_parent_pairs, pair_id)
    }

    public fun get_user_invitations(capy_addr: address, user_addr: address): vector<u64> acquires GlobalInvitations {
        let global_invitations = borrow_global<GlobalInvitations>(capy_addr);
        if (table::contains(&global_invitations.user_invitations, user_addr)) {
            *table::borrow(&global_invitations.user_invitations, user_addr)
        } else {
            vector::empty()
        }
    }

    public fun get_user_pairs(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        if (table::contains(&capy_data.user_pairs, user_addr)) {
            *table::borrow(&capy_data.user_pairs, user_addr)
        } else {
            vector::empty()
        }
    }

    // Public view functions for external access
    #[view]
    public fun get_invitation_view(capy_addr: address, invitation_id: u64): Invitation acquires GlobalInvitations {
        get_invitation(capy_addr, invitation_id)
    }

    #[view]
    public fun get_coparent_pair_view(capy_addr: address, pair_id: u64): CoParentPair acquires CapyData {
        get_coparent_pair(capy_addr, pair_id)
    }

    #[view]
    public fun get_user_invitations_view(capy_addr: address, user_addr: address): vector<u64> acquires GlobalInvitations {
        get_user_invitations(capy_addr, user_addr)
    }

    #[view]
    public fun get_user_pairs_view(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        get_user_pairs(capy_addr, user_addr)
    }

    // Pet interaction functions
    public entry fun feed_pet(account: &signer, pair_id: u64) acquires CapyData {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global<CapyData>(account_addr);
        assert!(table::contains(&capy_data.co_parent_pairs, pair_id), E_INVITATION_NOT_FOUND);
        
        let pair = table::borrow(&capy_data.co_parent_pairs, pair_id);
        assert!(pair.parent1 == account_addr || pair.parent2 == account_addr, E_NOT_AUTHORIZED);
        // Pet feeding logic would go here
    }

    public entry fun show_love_to_pet(account: &signer, pair_id: u64) acquires CapyData {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global<CapyData>(account_addr);
        assert!(table::contains(&capy_data.co_parent_pairs, pair_id), E_INVITATION_NOT_FOUND);
        
        let pair = table::borrow(&capy_data.co_parent_pairs, pair_id);
        assert!(pair.parent1 == account_addr || pair.parent2 == account_addr, E_NOT_AUTHORIZED);
        // Pet love logic would go here
    }

    // Marketplace Functions
    public entry fun add_marketplace_item(
        account: &signer,
        name: vector<u8>,
        item_type: u8,
        price: u64,
        description: vector<u8>,
        image_url: vector<u8>
    ) acquires CapyData {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global_mut<CapyData>(account_addr);
        let item_id = capy_data.next_item_id;
        
        let item = MarketplaceItem {
            id: item_id,
            name,
            item_type,
            price,
            description,
            image_url,
            available: true,
        };
        
        table::add(&mut capy_data.marketplace_items, item_id, item);
        capy_data.next_item_id = capy_data.next_item_id + 1;
    }

    public entry fun purchase_item(account: &signer, item_id: u64) acquires CapyData {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global_mut<CapyData>(account_addr);
        assert!(table::contains(&capy_data.marketplace_items, item_id), E_ITEM_NOT_FOUND);
        
        let item = table::borrow_mut(&mut capy_data.marketplace_items, item_id);
        assert!(item.available, E_ITEM_NOT_FOUND);
        
        // Check if user already owns this item
        if (!table::contains(&capy_data.user_inventory, account_addr)) {
            move_to(account, UserInventory {
                owned_items: table::new(),
                total_items: 0,
            });
        };
        
        let user_inventory = table::borrow_mut(&mut capy_data.user_inventory, account_addr);
        assert!(!table::contains(&user_inventory.owned_items, item_id), E_ITEM_ALREADY_OWNED);
        
        // Add item to user inventory
        table::add(&mut user_inventory.owned_items, item_id, true);
        user_inventory.total_items = user_inventory.total_items + 1;
        
        // Emit purchase event
        event::emit(ItemPurchasedEvent {
            buyer: account_addr,
            item_id,
            item_name: item.name,
            price: item.price,
            timestamp: timestamp::now_microseconds(),
        });
    }

    public entry fun feed_pet_with_item(account: &signer, pair_id: u64, food_item_id: u64) acquires CapyData {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global<CapyData>(account_addr);
        assert!(table::contains(&capy_data.co_parent_pairs, pair_id), E_INVITATION_NOT_FOUND);
        
        let pair = table::borrow(&capy_data.co_parent_pairs, pair_id);
        assert!(pair.parent1 == account_addr || pair.parent2 == account_addr, E_NOT_AUTHORIZED);
        
        // Check if user owns the food item
        assert!(table::contains(&capy_data.user_inventory, account_addr), E_ITEM_NOT_FOUND);
        let user_inventory = table::borrow(&capy_data.user_inventory, account_addr);
        assert!(table::contains(&user_inventory.owned_items, food_item_id), E_ITEM_NOT_FOUND);
        
        // Emit pet fed event
        event::emit(PetFedEvent {
            user: account_addr,
            pair_id,
            food_item_id,
            happiness_increase: 15, // Food increases happiness by 15
            timestamp: timestamp::now_microseconds(),
        });
    }

    // Reward System Functions
    public entry fun claim_game_reward(account: &signer, game_type: vector<u8>, score: u64) acquires CapyData {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        assert!(score > 0, E_INVALID_GAME_SCORE);
        
        let capy_data = borrow_global_mut<CapyData>(account_addr);
        let reward_id = capy_data.next_reward_id;
        
        // Calculate reward amount based on score (1 APT per 10 points, max 10 APT)
        let reward_amount = if (score > 100) { 10 } else { score / 10 };
        if (reward_amount == 0) { reward_amount = 1 }; // Minimum 1 APT reward
        
        let reward = GameReward {
            id: reward_id,
            user: account_addr,
            game_type,
            score,
            reward_amount,
            claimed: true,
            created_at: timestamp::now_microseconds(),
        };
        
        // Add to user rewards
        if (!table::contains(&capy_data.user_rewards, account_addr)) {
            table::add(&mut capy_data.user_rewards, account_addr, vector::empty());
        };
        let user_rewards = table::borrow_mut(&mut capy_data.user_rewards, account_addr);
        vector::push_back(user_rewards, reward_id);
        
        capy_data.next_reward_id = capy_data.next_reward_id + 1;
        
        // Emit reward claimed event
        event::emit(GameRewardClaimedEvent {
            user: account_addr,
            reward_id,
            game_type,
            score,
            reward_amount,
            timestamp: timestamp::now_microseconds(),
        });
    }

    // View Functions for Marketplace
    public fun get_marketplace_item(capy_addr: address, item_id: u64): MarketplaceItem acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        assert!(table::contains(&capy_data.marketplace_items, item_id), E_ITEM_NOT_FOUND);
        *table::borrow(&capy_data.marketplace_items, item_id)
    }

    public fun get_user_inventory(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        if (table::contains(&capy_data.user_inventory, user_addr)) {
            // For now, return empty vector - will be implemented properly later
            vector::empty()
        } else {
            vector::empty()
        }
    }

    public fun get_user_rewards(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        if (table::contains(&capy_data.user_rewards, user_addr)) {
            *table::borrow(&capy_data.user_rewards, user_addr)
        } else {
            vector::empty()
        }
    }

    // Public view functions for external access
    #[view]
    public fun get_marketplace_item_view(capy_addr: address, item_id: u64): MarketplaceItem acquires CapyData {
        get_marketplace_item(capy_addr, item_id)
    }

    #[view]
    public fun get_user_inventory_view(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        get_user_inventory(capy_addr, user_addr)
    }

    #[view]
    public fun get_user_rewards_view(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        get_user_rewards(capy_addr, user_addr)
    }
}
