# Copyright (c) 2025, assimilate and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class MouldParameter(Document):
	pass


@frappe.whitelist()
def get_parameters_for_mould(doctype, txt, searchfield, start, page_len, filters):
    mould_no = filters.get("mould_no")

    if not mould_no:
        return []

    return frappe.db.sql("""
        SELECT parameter
        FROM `tabParameters Table`
        WHERE parent = %s
        AND parameter LIKE %s
        LIMIT %s OFFSET %s
    """, (mould_no, f"%{txt}%", page_len, start))



@frappe.whitelist()
def get_parameter_details(parameter=None, mould_no=None):
    if not parameter or not mould_no:
        return {}

    return frappe.db.get_value(
        "Parameters Table",
        {
            "parent": mould_no,
            "parameter": parameter
        },
        ["value"],  # Add more fields if needed
        as_dict=True
    )
