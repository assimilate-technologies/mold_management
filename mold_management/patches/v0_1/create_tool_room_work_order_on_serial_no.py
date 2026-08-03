import frappe


def execute():
    if not frappe.db.exists(
        "Custom Field",
        {
            "dt": "Serial No",
            "fieldname": "tool_room_work_order",
        },
    ):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Serial No",
            "label": "Tool Room Work Order",
            "fieldname": "tool_room_work_order",
            "fieldtype": "Link",
            "options": "Tool Room Work Order",
            "insert_after": "work_order"

        }).insert()

        frappe.db.commit()
