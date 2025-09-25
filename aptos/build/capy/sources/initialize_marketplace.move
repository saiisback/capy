script {
    use capy::capy;

    fun initialize_marketplace(account: &signer) {
        
        // Add food items
        capy::add_marketplace_item(
            account,
            b"Premium Cat Food",
            1, // ITEM_TYPE_FOOD
            1, // 1 APT
            b"High-quality cat food that increases happiness by 15",
            b"/CatPackPaid/CatItems/CatToys/catfood.png"
        );
        
        capy::add_marketplace_item(
            account,
            b"Deluxe Fish",
            1, // ITEM_TYPE_FOOD
            1, // 1 APT
            b"Fresh fish that increases happiness by 20",
            b"/CatPackPaid/CatItems/CatToys/fish.png"
        );
        
        capy::add_marketplace_item(
            account,
            b"Special Treats",
            1, // ITEM_TYPE_FOOD
            1, // 1 APT
            b"Special treats that increase happiness by 25",
            b"/CatPackPaid/CatItems/CatToys/CatBowls.png"
        );
        
        // Add toy items
        capy::add_marketplace_item(
            account,
            b"Blue Ball",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"Interactive blue ball for your pet",
            b"/CatPackPaid/CatItems/CatToys/BlueBall.gif"
        );
        
        capy::add_marketplace_item(
            account,
            b"Mouse Toy",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"Realistic mouse toy for hunting practice",
            b"/CatPackPaid/CatItems/CatToys/Mouse.gif"
        );
        
        capy::add_marketplace_item(
            account,
            b"Laser Pointer",
            2, // ITEM_TYPE_TOY
            1, // 1 APT
            b"High-tech laser pointer for endless fun",
            b"/CatPackPaid/CatItems/CatToys/CatToy.gif"
        );
        
        // Add furniture items
        capy::add_marketplace_item(
            account,
            b"Blue Cat Bed",
            3, // ITEM_TYPE_FURNITURE
            1, // 1 APT
            b"Comfortable blue bed for your pet",
            b"/CatPackPaid/CatItems/Beds/CatBedBlue.png"
        );
        
        capy::add_marketplace_item(
            account,
            b"Purple Cat Bed",
            3, // ITEM_TYPE_FURNITURE
            1, // 1 APT
            b"Luxurious purple bed for your pet",
            b"/CatPackPaid/CatItems/Beds/CatBedPurple.png"
        );
        
        capy::add_marketplace_item(
            account,
            b"Cat Home",
            3, // ITEM_TYPE_FURNITURE
            1, // 1 APT
            b"Complete cat home with multiple rooms",
            b"/CatPackPaid/CatItems/Beds/CatHomes.png"
        );
        
        // Add decoration items
        capy::add_marketplace_item(
            account,
            b"Flower Pot",
            4, // ITEM_TYPE_DECORATION
            1, // 1 APT
            b"Beautiful flower pot to decorate the room",
            b"/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png"
        );
        
        capy::add_marketplace_item(
            account,
            b"Wall Art",
            4, // ITEM_TYPE_DECORATION
            1, // 1 APT
            b"Elegant wall art for the pet room",
            b"/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png"
        );
        
        // Add game items
        capy::add_marketplace_item(
            account,
            b"Puzzle Game",
            2, // ITEM_TYPE_TOY (using toy type for games)
            1, // 1 APT
            b"Interactive puzzle game to keep your pet entertained",
            b"/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png"
        );
        
        capy::add_marketplace_item(
            account,
            b"Arcade Machine",
            2, // ITEM_TYPE_TOY (using toy type for games)
            1, // 1 APT
            b"Retro arcade machine for gaming fun",
            b"/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png"
        );
    }
}
