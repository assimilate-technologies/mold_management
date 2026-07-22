frappe.ui.form.on('Item', {
    validate: function (frm) {
        if (!frm.doc.is_mould_item && !frm.doc.is_moulding && !frm.doc.other_than_mould_or_moulding) {
            frappe.throw(__('Please check at least one: "Is Mould" or "Is Moulding" or "Other than Mould/Moulding".'));
        }
    }
});
