import frappe


def execute():
    fields_to_fix = [
        "mould",
        "req_boxsizes",
        "req_poly_bags_sizes",
        "mould_selection_table",
        "cavity",
        "pcs_wt",
        "runner_wt",
        "shot_wt",
        "gross_wt",
        "cycle_time",
        "drilling",
        "shift_prod",
        "gluing",
        "bending",
        "clipping",
        "def_1_hrs",
        "cutting_1_hrs",
        "checking_1_hrs",
        "engraving_in_1hrs",
        "standard_pkg_of_polybag",
        "std_pkg_box",
        "req_total_box",
    ]

    for fieldname in fields_to_fix:
        cf = frappe.db.get_value(
            "Custom Field",
            {"dt": "Item", "fieldname": fieldname},
            ["name", "reqd", "mandatory_depends_on"],
            as_dict=True,
        )
        if not cf:
            continue

        updates = {}
        if cf.reqd:
            updates["reqd"] = 0
        if cf.mandatory_depends_on:
            updates["mandatory_depends_on"] = ""

        if updates:
            frappe.db.set_value("Custom Field", cf.name, updates)

    frappe.clear_cache()
