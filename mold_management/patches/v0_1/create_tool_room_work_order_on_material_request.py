import frappe


def execute():
    if not frappe.db.exists(
        "Custom Field",
        {
            "dt": "Material Request",
            "fieldname": "tool_room_work_order",
        },
    ):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Material Request",
            "label": "Tool Room Work Order",
            "fieldname": "tool_room_work_order",
            "fieldtype": "Link",
            "options": "Tool Room Work Order",
            "insert_after": "material_request_type"

        }).insert()

        frappe.db.commit()
