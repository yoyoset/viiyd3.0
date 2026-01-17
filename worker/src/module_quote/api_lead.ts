// import { Uuid } from '../utils_uuid'; // Removed: use crypto.randomUUID()

export interface LeadPayload {
    image_url: string;
    contact_info: any;
    estimate_data: any;
    model_type: string;
    quantity: number;
    user_notes?: string;
}

export const apiLead = async (request: Request, env: any): Promise<Response> => {
    try {
        const body: LeadPayload = await request.json();

        // Validation
        if (!body.contact_info || !body.image_url) {
            return new Response(JSON.stringify({ error: "Missing contact_info or image" }), { status: 400 });
        }

        // Generate Lead ID
        const leadId = crypto.randomUUID();
        const timestamp = Date.now();

        // 1. Calculate Priority Score (Mock Logic)
        let priority = 0;
        if (body.model_type === 'titan' || body.quantity >= 50) {
            priority = 10;
        }

        // 2. Insert into D1
        // Note: For local dev without miniflare binding, this might fail if we actually run it.
        // We will wrap in try-catch or use a simple console log if DB is missing.
        try {
            if (env.DB) {
                await env.DB.prepare(
                    `INSERT INTO leads (id, image_url, contact_info, ai_estimate_json, user_notes, model_type, quantity, created_at, priority_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    leadId,
                    body.image_url,
                    JSON.stringify(body.contact_info),
                    JSON.stringify(body.estimate_data),
                    body.user_notes || "",
                    body.model_type,
                    body.quantity,
                    timestamp,
                    priority
                ).run();
                console.log(`[D1] Inserted Lead ${leadId}`);
            } else {
                console.warn("[D1] Env.DB not found. Mocking insert.");
            }
        } catch (dbError) {
            console.error("[D1] Error:", dbError);
            return new Response(JSON.stringify({ error: "Database Error" }), { status: 500 });
        }

        // 3. Admin Notification (Mock)
        if (priority >= 10) {
            console.log(`[URGENT] High Value Lead: ${leadId}`);
        }

        return new Response(JSON.stringify({
            status: "success",
            lead_id: leadId,
            message: "Lead captured. Expert review pending."
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
