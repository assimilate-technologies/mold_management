import frappe

def execute():
    if not frappe.db.exists("Custom Field", {
        "dt": "Work Order",
        "fieldname": "work_order_routing"
    }):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Work Order",
            "label": "Work Order Routing",
            "fieldname": "work_order_routing",
            "fieldtype": "Link",
            "options": "Work Order Routing",
            "insert_after": "transfer_material_against"
            
        }).insert(ignore_permissions=True)

    frappe.clear_cache()
