module cybrosnetwork::cybrosnetwork {

    // use std::string::{Self, String};
    use sui::transfer;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event::emit;

    struct AdminCap has key {
        id: UID,
    }

    struct Treasury has key, store {
        id: UID,
        fee: u64,
        balance: Balance<SUI>,
    }

    // Events
    struct NewPrompt has copy, drop {
        data: vector<u8>,
    }

    fun init(ctx: &mut TxContext) {
        let admin = AdminCap{ id: object::new(ctx) };
        let treasury = Treasury {
            id: object::new(ctx),
            fee: 500_000_000,
            balance: balance::zero<SUI>(),
        };

        transfer::transfer(admin, tx_context::sender(ctx));
        transfer::public_share_object(treasury);
    }

    public entry fun broker(treasury: &mut Treasury, fee: &mut Coin<SUI>, prompt: vector<u8>, ctx: &mut TxContext) {
        let pay_coin: Coin<SUI> = coin::split(fee, treasury.fee, ctx);
        coin::put(&mut treasury.balance, pay_coin);
        emit(NewPrompt{ data: prompt });
    }

    // Admin Only
    public entry fun update_fee(treasury: &mut Treasury, _: &AdminCap, new_fee: u64) {
        treasury.fee = new_fee
    }

    public entry fun withdraw(treasury: &mut Treasury, _: &AdminCap, ctx: &mut TxContext) {
        let return_coin: Coin<SUI> = coin::from_balance(balance::withdraw_all(&mut treasury.balance), ctx);
        transfer::public_transfer(return_coin, tx_context::sender(ctx));
    }
}