import frappe
from frappe import _
from frappe.utils import nowdate, flt

@frappe.whitelist()
def get_report_data(reference_name=None, quality_inspection_template=None):
    if not reference_name:
        # Get latest Incoming Quality Inspection as default
        latest_qi = frappe.db.get_value("Quality Inspection", {"inspection_type": ["in", ["Incoming", "PDI"]], "docstatus": ["<", 2]}, "name", order_by="creation desc")
        if not latest_qi:
            return []
        reference_name = latest_qi

    # Identify if it's a Quality Inspection directly or a Purchase Receipt
    is_qi = frappe.db.exists("Quality Inspection", reference_name)
    is_pr = frappe.db.exists("Purchase Receipt", reference_name)
    
    inspections = []
    if is_qi:
        qi = frappe.get_doc("Quality Inspection", reference_name)
        inspections = [qi]
    elif is_pr:
        inspections = frappe.get_all("Quality Inspection", 
            filters={"reference_name": reference_name, "docstatus": 1, "inspection_type": ["in", ["Incoming", "PDI"]]},
            fields=["*"]
        )
    
    if not inspections:
        # Final fallback: search for ANY QI with this reference
        inspections = frappe.get_all("Quality Inspection", 
            filters={"name": reference_name, "docstatus": ["<", 2]},
            fields=["*"]
        )

    report_data = []
    for qi_data in inspections:
        qi = frappe.get_doc("Quality Inspection", qi_data.name) if isinstance(qi_data, dict) else qi_data
        sheet = build_sheet_data(qi, quality_inspection_template)
        report_data.append(sheet)

    return report_data

def build_sheet_data(qi, custom_template=None):
    item_code = qi.item_code
    item = frappe.get_doc("Item", item_code)
    
    # Template
    template_name = custom_template or qi.quality_inspection_template or item.get("quality_inspection_template")
    parameters = []
    if template_name:
        parameters = frappe.get_all("Item Quality Inspection Parameter",
            filters={"parent": template_name},
            fields=["*"],
            order_by="idx"
        )

    # Fetch readings
    qi.readings = frappe.get_all("Quality Inspection Reading",
        filters={"parent": qi.name},
        fields=["*"]
    )

    # Header Data
    vendor = qi.get("vendor_name") or qi.get("vendor") or ""
    reference = qi.get("reference_name") or ""
    batch_no = qi.get("batch_no") or ""
    qty = qi.get("sample_size") or ""
    sample_size = qi.get("sample_size") or ""
    
    return {
        "qi": {
            "name": qi.name,
            "item_code": qi.item_code,
            "batch_no": batch_no,
            "vendor": vendor,
            "reference": reference,
            "sample_size": sample_size,
            "challan_no": qi.get("challan_no") or "",
            "challan_date": qi.get("challan_date") or "",
            "doc_no": "YPEW/QA-F-02",
            "rev_no": "00",
            "rev_date": "01.02.2021"
        },
        "item": {
            "item_name": item.item_name,
            "model": item.get("model") or item.get("custom_model") or "",
            "raw_material": item.get("raw_material") or "",
            "masterbatch": item.get("masterbatch") or "",
            "control_plan": item.get("control_plan_reference") or "-F/YPEW/QA/CP/08"
        },
        "template_name": template_name,
        "parameters": parameters,
        "inspections": [qi],
        "today": nowdate(),
        "vendor": vendor,
        "qty": flt(qty)
    }
