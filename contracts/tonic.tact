// ════════════════════════════════════════════════════════════════════════════
// Tonic AI — $TONIC Jetton Smart Contract (TEP-74 / TEP-89 compliant)
// Language : Tact
// Network  : TON Testnet → Mainnet
// Deploy   : node contracts/deploy.mjs
// ════════════════════════════════════════════════════════════════════════════

import "@stdlib/deploy";
import "@stdlib/ownable";

// ── Message definitions ───────────────────────────────────────────────────────

message(0x178d4519) TokenTransferInternal {
    queryId:             Int as uint64;
    amount:              Int as coins;
    from:                Address;
    responseDestination: Address?;
    forwardTonAmount:    Int as coins;
    forwardPayload:      Slice as remaining;
}

message(0x7362d09c) TokenNotification {
    queryId:         Int as uint64;
    amount:          Int as coins;
    from:            Address;
    forwardPayload:  Slice as remaining;
}

message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}

message(0x0f8a7ea5) TokenTransfer {
    queryId:             Int as uint64;
    amount:              Int as coins;
    destination:         Address;
    responseDestination: Address?;
    customPayload:       Cell?;
    forwardTonAmount:    Int as coins;
    forwardPayload:      Slice as remaining;
}

message(0x595f07bc) TokenBurn {
    queryId:             Int as uint64;
    amount:              Int as coins;
    responseDestination: Address?;
}

message(0x7bdd97de) TokenBurnNotification {
    queryId:             Int as uint64;
    amount:              Int as coins;
    sender:              Address;
    responseDestination: Address?;
}

message MintTokens {
    to:     Address;
    amount: Int as coins;
    memo:   String;  // e.g. "task_complete" | "streak_7" | "achievement_xyz"
}

message UpdateContent {
    content: Cell;
}

// ── Jetton Wallet ─────────────────────────────────────────────────────────────

contract TonicWallet {
    balance: Int as coins = 0;
    owner:   Address;
    master:  Address;

    init(owner: Address, master: Address) {
        self.owner  = owner;
        self.master = master;
    }

    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();
        require(
            ctx.sender == self.master || ctx.sender == contractAddress(initOf TonicWallet(self.owner, self.master)),
            "TonicWallet: unauthorized transfer"
        );
        self.balance += msg.amount;

        if (msg.forwardTonAmount > 0) {
            send(SendParameters{
                to:    self.owner,
                value: msg.forwardTonAmount,
                body:  TokenNotification{
                    queryId:        msg.queryId,
                    amount:         msg.amount,
                    from:           msg.from,
                    forwardPayload: msg.forwardPayload,
                }.toCell(),
            });
        }

        let excess: Int = ctx.value - msg.forwardTonAmount - ton("0.01");
        if (excess > 0 && msg.responseDestination != null) {
            send(SendParameters{
                to:    msg.responseDestination!!,
                value: excess,
                body:  TokenExcesses{ queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "TonicWallet: only owner can transfer");
        require(self.balance >= msg.amount, "TonicWallet: insufficient balance");
        require(ctx.value >= ton("0.05"), "TonicWallet: insufficient gas");

        self.balance -= msg.amount;

        let walletInit: StateInit = initOf TonicWallet(msg.destination, self.master);
        send(SendParameters{
            to:     contractAddress(walletInit),
            value:  ctx.value - ton("0.05"),
            bounce: true,
            body: TokenTransferInternal{
                queryId:             msg.queryId,
                amount:              msg.amount,
                from:                self.owner,
                responseDestination: msg.responseDestination,
                forwardTonAmount:    msg.forwardTonAmount,
                forwardPayload:      msg.forwardPayload,
            }.toCell(),
            code: walletInit.code,
            data: walletInit.data,
        });
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "TonicWallet: only owner can burn");
        require(self.balance >= msg.amount, "TonicWallet: insufficient balance");
        self.balance -= msg.amount;
        send(SendParameters{
            to:    self.master,
            value: 0,
            mode:  SendRemainingValue,
            body:  TokenBurnNotification{
                queryId:             msg.queryId,
                amount:              msg.amount,
                sender:              self.owner,
                responseDestination: msg.responseDestination,
            }.toCell(),
        });
    }

    get fun balance(): Int     { return self.balance; }
    get fun owner(): Address   { return self.owner; }
    get fun master(): Address  { return self.master; }

    get fun walletData(): map<String, Int> {
        let data: map<String, Int> = emptyMap();
        data.set("balance", self.balance);
        return data;
    }
}

// ── Jetton Minter (Master Contract) ──────────────────────────────────────────

contract TonicJettonMinter with Deployable, Ownable {
    totalSupply: Int as coins = 0;
    owner:       Address;
    content:     Cell;       // TEP-64 token metadata
    mintable:    Bool = true;

    init(owner: Address, content: Cell) {
        self.owner   = owner;
        self.content = content;
    }

    // ── Minting (owner only) ─────────────────────────────────────────────────
    receive(msg: MintTokens) {
        self.requireOwner();
        require(self.mintable, "TonicMinter: minting disabled");
        require(msg.amount > 0, "TonicMinter: amount must be > 0");

        let walletInit: StateInit = initOf TonicWallet(msg.to, myAddress());
        self.totalSupply += msg.amount;

        send(SendParameters{
            to:     contractAddress(walletInit),
            value:  ton("0.05"),
            bounce: false,
            body: TokenTransferInternal{
                queryId:             0,
                amount:              msg.amount,
                from:                myAddress(),
                responseDestination: self.owner,
                forwardTonAmount:    ton("0.01"),
                forwardPayload:      beginCell()
                                       .storeUint(0, 32)
                                       .storeStringTail(msg.memo)
                                     .endCell().asSlice(),
            }.toCell(),
            code: walletInit.code,
            data: walletInit.data,
        });
    }

    // ── Burn notifications ───────────────────────────────────────────────────
    receive(msg: TokenBurnNotification) {
        let expectedWallet: Address = contractAddress(initOf TonicWallet(msg.sender, myAddress()));
        require(context().sender == expectedWallet, "TonicMinter: invalid burn source");
        self.totalSupply -= msg.amount;
        if (msg.responseDestination != null) {
            send(SendParameters{
                to:    msg.responseDestination!!,
                value: 0,
                mode:  SendRemainingValue,
                body:  TokenExcesses{ queryId: msg.queryId }.toCell(),
            });
        }
    }

    // ── Admin ────────────────────────────────────────────────────────────────
    receive(msg: UpdateContent) {
        self.requireOwner();
        self.content = msg.content;
    }

    receive("disable_mint") {
        self.requireOwner();
        self.mintable = false;
    }

    // ── Getters (TEP-74) ─────────────────────────────────────────────────────
    get fun get_jetton_data(): JettonData {
        return JettonData{
            totalSupply:  self.totalSupply,
            mintable:     self.mintable,
            adminAddress: self.owner,
            content:      self.content,
            walletCode:   (initOf TonicWallet(self.owner, myAddress())).code,
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf TonicWallet(owner, myAddress()));
    }

    get fun totalSupply(): Int { return self.totalSupply; }
    get fun mintable(): Bool   { return self.mintable; }
    get fun owner(): Address   { return self.owner; }
}

struct JettonData {
    totalSupply:  Int;
    mintable:     Bool;
    adminAddress: Address;
    content:      Cell;
    walletCode:   Cell;
}
