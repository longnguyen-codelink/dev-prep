Areas changed:
- lastTotal global var
    + Eliminate the use of global var
    + Keep lastTotal track by using class

- Split code into more testable and reusable functions
    + getDiscount
    + getUser
    + getTax
    + writeReceipts
 => processOrder as orchestrator

- Use enum with proper naming instead of unamed const
    + 0.2 = TaxRate.DEFAULT
    + 0.15 = DiscountSubTotalRate.WELCOME_RATE
    + 0.1 = DiscountSubTotalRate.VIP_RATE

- Add error handling
    + writeReceipt => handle no "receipts" folder
    + getUser => early throw with proper naming: url, userId
    + getTax => throw with proper naming: tax

- Remove any
    + lastTotal: any => number
    + it: any => number (auto infered by typescript map function)
    + user: any => User (custom interface)