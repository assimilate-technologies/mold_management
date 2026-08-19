frappe.ui.form.on('Item', {
    mould: function(frm) {
        if (frm.doc.mould) {
            frappe.db.get_value('Mould', frm.doc.mould, 'cavity_count')
                .then(r => {
                    if (r && r.message) {
                        frm.set_value('cavity', r.message.cavity_count);
                    }
                });
        } else {
            frm.set_value('cavity', '');
        }
    }
});
