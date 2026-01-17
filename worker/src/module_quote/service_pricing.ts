export class PricingService {
    // Base prices in USD
    // TODO: These should ideally come from a D1 Config table later
    private static BASE_PRICES: Record<string, number> = {
        'infantry': 30,
        'character': 80,
        'vehicle': 150,
        'monster': 200,
        'titan': 800,
        'terrain': 50
    };

    /**
     * Calculates the estimated price range.
     * @param modelType "infantry", "vehicle", etc.
     * @param quantity Number of models
     * @param complexityScore 1.0 (Simple) to 2.0 (Complex)
     */
    static calculate(modelType: string, quantity: number, complexityScore: number) {
        // 1. Validate inputs
        const type = modelType.toLowerCase();
        const basePrice = this.BASE_PRICES[type] || this.BASE_PRICES['infantry']; // Default to infantry
        const count = Math.max(1, quantity);
        const complexity = Math.max(1.0, Math.min(2.0, complexityScore));

        // 2. Calculate Unit Price
        // Formula: Base * Complexity
        let unitPrice = basePrice * complexity;

        // 3. Apply Bulk Discounts
        // 5-9: 5% Off
        // 10+: 10% Off
        let discountRate = 0;
        if (count >= 10) {
            discountRate = 0.10;
        } else if (count >= 5) {
            discountRate = 0.05;
        }

        unitPrice = unitPrice * (1 - discountRate);

        // 4. Calculate Total
        const total = unitPrice * count;

        // 5. Create a "Range" for the user ( +/- 15% ) to avoid commitment
        const minTotal = Math.floor(total * 0.85);
        const maxTotal = Math.ceil(total * 1.15);

        return {
            currency: 'USD',
            model_type: type,
            quantity: count,
            discount_applied: `${discountRate * 100}%`,
            per_unit_est: Math.round(unitPrice),
            total_range: {
                min: minTotal,
                max: maxTotal
            },
            notes: "Estimate only. Final price subject to human review."
        };
    }
}
