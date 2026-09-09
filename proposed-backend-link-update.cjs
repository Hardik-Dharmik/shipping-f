const fs = require('fs');
const file = '../shipping-b/routes/addressForms.js';
let source = fs.readFileSync(file, 'utf8');
source = source.replace("const { resolveCustomerId }", "const { resolveCustomerId, ORDER_CUSTOMER_SELECT }");
source = source.replace(".select('id, code, form_type, status, is_submitted, expires_at, created_at, order_data')", ".select('id, user_id, order_id, awb_number, code, form_type, status, is_submitted, expires_at, created_at, order_data')");
const start = source.indexOf('    if (data.is_submitted) {', source.indexOf("router.get('/address-forms/public/:code'"));
const end = source.indexOf('    if (data.expires_at', start);
if (start < 0 || end < 0) throw new Error('Public route not found');
source = source.slice(0, start) + `    // A completed link is a read-only receipt, even after its submission deadline.
    // Resolve only the order associated with this form and its owner.
    if (data.order_id) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(ORDER_CUSTOMER_SELECT)
        .eq('id', data.order_id)
        .eq('user_id', data.user_id)
        .single();
      if (orderError || !order) {
        return res.status(404).json({ success: false, error: 'The linked order is unavailable' });
      }
      return res.json({ success: true, data: {
        code: data.code, status: 'ordered', is_submitted: true,
        order, awb_number: order.awb_number
      } });
    }
    if (data.is_submitted || data.status === 'ordered') {
      return res.json({ success: true, data: {
        code: data.code, status: data.status, is_submitted: true,
        awb_number: data.awb_number || null
      } });
    }

` + source.slice(end);
source = source.replace('    delete responseData.order_data;', '    delete responseData.order_data;\n    delete responseData.user_id;');
fs.writeFileSync(file, source);
