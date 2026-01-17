import { PricingService } from './service_pricing';

export const apiEstimate = async (request: Request): Promise<Response> => {
    try {
        const body: any = await request.json();
        const { image_url, model_type, quantity } = body;

        if (!model_type || !quantity) {
            return new Response(JSON.stringify({ error: "Missing model_type or quantity" }), { status: 400 });
        }

        // MOCK AI ANALYSIS
        // In real version, we would call GPT/Claude Vision here.
        // Random complexity between 1.0 (Standard) and 1.5 (High Detail)
        const mockComplexity = 1.0 + Math.random() * 0.5;

        // Calculate
        const estimate = PricingService.calculate(model_type, quantity, mockComplexity);

        return new Response(JSON.stringify({
            status: "success",
            ai_analysis: {
                complexity_score: mockComplexity.toFixed(2),
                detected_features: ["Edges", "Standard Trim"] // Mock tags
            },
            estimate: estimate
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
