module capy::capy {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
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
    const E_COLLECTION_NOT_FOUND: u64 = 15;

    // NFT Collection constants
    const CAPY_COLLECTION_NAME: vector<u8> = b"Capy Co-Parent Pets";
    const CAPY_COLLECTION_DESCRIPTION: vector<u8> = b"Digital pets created through co-parent collaboration";
    const CAPY_COLLECTION_URI: vector<u8> = b"https://capy.app/collection";

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

    // Pet NFT struct - separate from CoParentPair (tracks NFT creation and metadata)
    struct PetNFT has store, copy, drop {
        pair_id: u64,
        owner: address, // The address that should own the NFT (sender)
        co_parent: address, // The co-parent address
        pet_name: String,
        pet_description: String,
        pet_metadata_uri: String, // URI for NFT metadata
        created_at: u64,
        claimed: bool, // Whether the NFT has been claimed/minted
    }

    // NFT Collection info - tracks collection metadata and supply
    struct CapyPetCollection has key {
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        total_supply: u64,
        claimed_supply: u64, // Number of NFTs actually claimed
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
        // NFT tracking
        pet_nfts: Table<u64, PetNFT>, // pair_id -> PetNFT
        user_pet_nfts: Table<address, vector<u64>>, // user -> pair_ids of their NFTs
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

    #[event]
    struct PetNFTMintedEvent has store, drop {
        pair_id: u64,
        nft_address: address,
        owner: address,
        co_parent: address,
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
            // NFT tracking
            pet_nfts: table::new(),
            user_pet_nfts: table::new(),
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

    // Initialize NFT collection (called once after deployment)
    public entry fun initialize_nft_collection(account: &signer) {
        let account_addr = signer::address_of(account);
        // Only the module owner can initialize
        assert!(account_addr == @capy, E_NOT_AUTHORIZED);
        assert!(!exists<CapyPetCollection>(account_addr), E_ALREADY_INITIALIZED);
        
        let collection_name = string::utf8(CAPY_COLLECTION_NAME);
        let collection_description = string::utf8(CAPY_COLLECTION_DESCRIPTION);
        let collection_uri = string::utf8(CAPY_COLLECTION_URI);
        
        move_to(account, CapyPetCollection {
            collection_name,
            collection_description,
            collection_uri,
            total_supply: 0,
            claimed_supply: 0,
        });
    }

    // Initialize marketplace items on contract account (called once after deployment)
    public entry fun initialize_contract_marketplace(account: &signer) acquires CapyData {
        let account_addr = signer::address_of(account);
        // Only the module owner can initialize
        assert!(account_addr == @capy, E_NOT_AUTHORIZED);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        // Add all marketplace items to the contract's marketplace
        add_marketplace_item(
            account,
            b"Premium Cat Food",
            1, // ITEM_TYPE_FOOD
            1, // 1 APT
            b"High-quality cat food that increases happiness by 15",
            b"/CatPackPaid/CatItems/CatToys/catfood.png"
        );
        
        add_marketplace_item(
            account,
            b"Deluxe Fish",
            1, // ITEM_TYPE_FOOD
            1, // 1 APT
            b"Fresh fish that increases happiness by 20",
            b"/CatPackPaid/CatItems/CatToys/fish.png"
        );
        
        add_marketplace_item(
            account,
            b"Special Treats",
            1, // ITEM_TYPE_FOOD
            1, // 1 APT
            b"Special treats that increase happiness by 25",
            b"/CatPackPaid/CatItems/CatToys/CatBowls.png"
        );
        
        add_marketplace_item(
            account,
            b"Blue Ball",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"Interactive blue ball for your pet",
            b"/CatPackPaid/CatItems/CatToys/BlueBall.gif"
        );
        
        add_marketplace_item(
            account,
            b"Mouse Toy",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"Realistic mouse toy for hunting practice",
            b"/CatPackPaid/CatItems/CatToys/Mouse.gif"
        );
        
        add_marketplace_item(
            account,
            b"Laser Pointer",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"High-tech laser pointer for endless fun",
            b"/CatPackPaid/CatItems/CatToys/CatToy.gif"
        );
        
        add_marketplace_item(
            account,
            b"Blue Cat Bed",
            3, // ITEM_TYPE_FURNITURE
            1, // 1 APT
            b"Comfortable blue bed for your pet",
            b"/CatPackPaid/CatItems/Beds/CatBedBlue.png"
        );
        
        add_marketplace_item(
            account,
            b"Purple Cat Bed",
            3, // ITEM_TYPE_FURNITURE
            1, // 1 APT
            b"Luxurious purple bed for your pet",
            b"/CatPackPaid/CatItems/Beds/CatBedPurple.png"
        );
        
        add_marketplace_item(
            account,
            b"Cat Home",
            3, // ITEM_TYPE_FURNITURE
            1, // 1 APT
            b"Complete cat home with multiple rooms",
            b"/CatPackPaid/CatItems/Beds/CatHomes.png"
        );
        
        add_marketplace_item(
            account,
            b"Flower Pot",
            4, // ITEM_TYPE_DECORATION
            1, // 1 APT
            b"Beautiful flower pot to decorate the room",
            b"/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png"
        );
        
        add_marketplace_item(
            account,
            b"Wall Art",
            4, // ITEM_TYPE_DECORATION
            1, // 1 APT
            b"Elegant wall art for the pet room",
            b"/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png"
        );
        
        add_marketplace_item(
            account,
            b"Puzzle Game",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"Interactive puzzle game to keep your pet entertained",
            b"/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png"
        );
        
        add_marketplace_item(
            account,
            b"Arcade Machine",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"Retro arcade machine for gaming fun",
            b"/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png"
        );
    }

    // Update marketplace item prices (only contract owner can call)
    public entry fun update_marketplace_prices(account: &signer) acquires CapyData {
        let account_addr = signer::address_of(account);
        // Only the module owner can update prices
        assert!(account_addr == @capy, E_NOT_AUTHORIZED);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global_mut<CapyData>(account_addr);
        
        // Update prices for all items (0.5 to 0.9 APT range)
        // Item 1: Premium Cat Food - 0.5 APT
        if (table::contains(&capy_data.marketplace_items, 1)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 1);
            item.price = 500000; // 0.5 APT in micro APT
        };
        
        // Item 2: Deluxe Fish - 0.6 APT
        if (table::contains(&capy_data.marketplace_items, 2)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 2);
            item.price = 600000; // 0.6 APT in micro APT
        };
        
        // Item 3: Special Treats - 0.7 APT
        if (table::contains(&capy_data.marketplace_items, 3)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 3);
            item.price = 700000; // 0.7 APT in micro APT
        };
        
        // Item 4: Blue Ball - 0.5 APT
        if (table::contains(&capy_data.marketplace_items, 4)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 4);
            item.price = 500000; // 0.5 APT in micro APT
        };
        
        // Item 5: Mouse Toy - 0.6 APT
        if (table::contains(&capy_data.marketplace_items, 5)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 5);
            item.price = 600000; // 0.6 APT in micro APT
        };
        
        // Item 6: Laser Pointer - 0.8 APT
        if (table::contains(&capy_data.marketplace_items, 6)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 6);
            item.price = 800000; // 0.8 APT in micro APT
        };
        
        // Item 7: Blue Cat Bed - 0.6 APT
        if (table::contains(&capy_data.marketplace_items, 7)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 7);
            item.price = 600000; // 0.6 APT in micro APT
        };
        
        // Item 8: Purple Cat Bed - 0.8 APT
        if (table::contains(&capy_data.marketplace_items, 8)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 8);
            item.price = 800000; // 0.8 APT in micro APT
        };
        
        // Item 9: Cat Home - 0.9 APT
        if (table::contains(&capy_data.marketplace_items, 9)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 9);
            item.price = 900000; // 0.9 APT in micro APT
        };
        
        // Item 10: Flower Pot - 0.5 APT
        if (table::contains(&capy_data.marketplace_items, 10)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 10);
            item.price = 500000; // 0.5 APT in micro APT
        };
        
        // Item 11: Wall Art - 0.7 APT
        if (table::contains(&capy_data.marketplace_items, 11)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 11);
            item.price = 700000; // 0.7 APT in micro APT
        };
        
        // Item 12: Puzzle Game - 0.7 APT
        if (table::contains(&capy_data.marketplace_items, 12)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 12);
            item.price = 700000; // 0.7 APT in micro APT
        };
        
        // Item 13: Arcade Machine - 0.9 APT
        if (table::contains(&capy_data.marketplace_items, 13)) {
            let item = table::borrow_mut(&mut capy_data.marketplace_items, 13);
            item.price = 900000; // 0.9 APT in micro APT
        };
    }

    // Helper function to create NFT metadata for tracking (placeholder until claimed)
    fun create_nft_metadata_placeholder(pair_id: u64, owner: address, co_parent: address): PetNFT {
        // Generate unique pet name using pair ID
        let pet_name_bytes = b"Capy Pet #";
        let pair_id_bytes = std::bcs::to_bytes(&pair_id);
        vector::append(&mut pet_name_bytes, pair_id_bytes);
        let pet_name = string::utf8(pet_name_bytes);
        
        // Generate metadata URI
        let uri_bytes = b"https://capy.app/api/pet/";
        vector::append(&mut uri_bytes, pair_id_bytes);
        vector::append(&mut uri_bytes, b"/metadata.json");
        let metadata_uri = string::utf8(uri_bytes);
        
        let pet_description = string::utf8(b"A collaborative digital pet created by co-parents on Capy. This NFT represents the unique bond between two users.");
        
        PetNFT {
            pair_id,
            owner,
            co_parent,
            pet_name,
            pet_description,
            pet_metadata_uri: metadata_uri,
            created_at: timestamp::now_microseconds(),
            claimed: false,
        }
    }

    // Function for users to claim their pet NFT - marks as claimed and emits event
    public entry fun claim_pet_nft(account: &signer, pair_id: u64) acquires CapyData, CapyPetCollection {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        let capy_data = borrow_global_mut<CapyData>(account_addr);
        assert!(table::contains(&capy_data.pet_nfts, pair_id), E_INVITATION_NOT_FOUND);
        
        let pet_nft = table::borrow_mut(&mut capy_data.pet_nfts, pair_id);
        assert!(pet_nft.owner == account_addr, E_NOT_AUTHORIZED);
        assert!(!pet_nft.claimed, E_REWARD_ALREADY_CLAIMED);
        
        // Check if NFT collection exists
        assert!(exists<CapyPetCollection>(@capy), E_COLLECTION_NOT_FOUND);
        let collection_data = borrow_global_mut<CapyPetCollection>(@capy);
        
        // Mark as claimed and update collection supply
        pet_nft.claimed = true;
        collection_data.claimed_supply = collection_data.claimed_supply + 1;
        
        // Emit NFT claimed event with all the metadata
        event::emit(PetNFTMintedEvent {
            pair_id,
            nft_address: account_addr, // Using claimer's address as NFT identifier
            owner: account_addr,
            co_parent: pet_nft.co_parent,
            timestamp: timestamp::now_microseconds(),
        });
    }

    // Send invitation to another user - no signature required from sender
    public entry fun send_invitation(_account: &signer, from_address: address, to_address: address) acquires GlobalInvitations {
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
    public entry fun accept_invitation(account: &signer, invitation_id: u64) acquires GlobalInvitations, CapyData, CapyPetCollection {
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
                // NFT tracking
                pet_nfts: table::new(),
                user_pet_nfts: table::new(),
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
        
        // Create NFT metadata for the sender's account (invitation.from)
        let pet_nft = create_nft_metadata_placeholder(pair_id, invitation.from, account_addr);
        
        // Store the NFT data
        table::add(&mut capy_data.pet_nfts, pair_id, pet_nft);
        
        // Add to sender's NFT list
        if (!table::contains(&capy_data.user_pet_nfts, invitation.from)) {
            table::add(&mut capy_data.user_pet_nfts, invitation.from, vector::empty());
        };
        let sender_nfts = table::borrow_mut(&mut capy_data.user_pet_nfts, invitation.from);
        vector::push_back(sender_nfts, pair_id);
        
        // Update NFT collection total (increment pending supply)
        if (exists<CapyPetCollection>(@capy)) {
            let _collection_data = borrow_global_mut<CapyPetCollection>(@capy);
            // Note: total_supply will be incremented when NFT is actually claimed
        };
        
        // Emit events
        event::emit(PetNFTMintedEvent {
            pair_id,
            nft_address: @capy, // NFT metadata created (actual minting when claimed)
            owner: invitation.from,
            co_parent: account_addr,
            timestamp: timestamp::now_microseconds(),
        });
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

    public entry fun purchase_item(account: &signer, item_id: u64) acquires CapyData, UserInventory {
        let account_addr = signer::address_of(account);
        assert!(exists<CapyData>(account_addr), E_NOT_INITIALIZED);
        
        // Get marketplace items from CONTRACT's account (@capy), not buyer's account
        assert!(exists<CapyData>(@capy), E_NOT_INITIALIZED);
        
        // First, get item details from contract's marketplace and store them
        let (item_name, item_price) = {
            let contract_capy_data = borrow_global<CapyData>(@capy);
            assert!(table::contains(&contract_capy_data.marketplace_items, item_id), E_ITEM_NOT_FOUND);
            
            let item = table::borrow(&contract_capy_data.marketplace_items, item_id);
            assert!(item.available, E_ITEM_NOT_FOUND);
            
            (item.name, item.price)
        };
        
        // Check if user already owns this item
        if (!exists<UserInventory>(account_addr)) {
            move_to(account, UserInventory {
                owned_items: table::new(),
                total_items: 0,
            });
        };
        
        let user_inventory = borrow_global_mut<UserInventory>(account_addr);
        assert!(!table::contains(&user_inventory.owned_items, item_id), E_ITEM_ALREADY_OWNED);
        
        // Add item to user inventory
        table::add(&mut user_inventory.owned_items, item_id, true);
        user_inventory.total_items = user_inventory.total_items + 1;
        
        // Emit purchase event with stored values
        event::emit(ItemPurchasedEvent {
            buyer: account_addr,
            item_id,
            item_name,
            price: item_price,
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
        
        let _reward = GameReward {
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

    // NFT View Functions
    public fun get_pet_nft(capy_addr: address, pair_id: u64): PetNFT acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        assert!(table::contains(&capy_data.pet_nfts, pair_id), E_INVITATION_NOT_FOUND);
        *table::borrow(&capy_data.pet_nfts, pair_id)
    }

    public fun get_user_pet_nfts(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        assert!(exists<CapyData>(capy_addr), E_NOT_INITIALIZED);
        let capy_data = borrow_global<CapyData>(capy_addr);
        if (table::contains(&capy_data.user_pet_nfts, user_addr)) {
            *table::borrow(&capy_data.user_pet_nfts, user_addr)
        } else {
            vector::empty()
        }
    }

    #[view]
    public fun get_pet_nft_view(capy_addr: address, pair_id: u64): PetNFT acquires CapyData {
        get_pet_nft(capy_addr, pair_id)
    }

    #[view]
    public fun get_user_pet_nfts_view(capy_addr: address, user_addr: address): vector<u64> acquires CapyData {
        get_user_pet_nfts(capy_addr, user_addr)
    }

    // Get NFT collection info
    public fun get_nft_collection_info(capy_addr: address): (String, String, String, u64, u64) acquires CapyPetCollection {
        assert!(exists<CapyPetCollection>(capy_addr), E_COLLECTION_NOT_FOUND);
        let collection = borrow_global<CapyPetCollection>(capy_addr);
        (collection.collection_name, collection.collection_description, collection.collection_uri, collection.total_supply, collection.claimed_supply)
    }

    #[view]
    public fun get_nft_collection_info_view(capy_addr: address): (String, String, String, u64, u64) acquires CapyPetCollection {
        get_nft_collection_info(capy_addr)
    }
}
