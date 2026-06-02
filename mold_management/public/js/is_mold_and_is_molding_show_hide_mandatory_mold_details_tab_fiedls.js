// frappe.ui.form.on('Item', {
//     refresh(frm) {
//         frm.trigger("toggle_fields");
//     },

//     is_mould_item(frm) {
//         frm.trigger("toggle_fields");
//     },

//     is_moulding(frm) {
//         frm.trigger("toggle_fields");
//     },

//     toggle_fields(frm) {
//         let mould_item = frm.doc.is_mould_item;
//         let moulding = frm.doc.is_moulding;

//         // Fields to show/hide and make mandatory
//         let fields = [
//             "shape", "material_type", "no_of_cavity", "side_cores",
//             "side_cores_qty", "hot_runner_system", "cold_runner_system",
//             "tool_life", "total_shots"
//         ];

//         if (mould_item) {
//             // 1️⃣ If is_mould_item = checked
//             frm.set_df_property("mould_selection_table", "reqd", 1);

//             fields.forEach(f => {
//                 frm.set_df_property(f, "hidden", 1);
//                 frm.set_df_property(f, "reqd", 0);
//             });

//             frm.set_df_property("mould_selection_table", "hidden", 0);
//         }
//         else if (moulding) {
//             // 2️⃣ If is_moulding = checked
//             frm.set_df_property("mould_selection_table", "hidden", 1);
//             frm.set_df_property("mould_selection_table", "reqd", 0);

//             fields.forEach(f => {
//                 frm.set_df_property(f, "hidden", 0);
//                 frm.set_df_property(f, "reqd", 1);
//             });
//         }
//         else {
//             // 3️⃣ If none selected -> Reset
//             frm.set_df_property("mould_selection_table", "hidden", 0);
//             frm.set_df_property("mould_selection_table", "reqd", 0);

//             fields.forEach(f => {
//                 frm.set_df_property(f, "hidden", 0);
//                 frm.set_df_property(f, "reqd", 0);
//             });
//         }
//     }
// });

frappe.ui.form.on("Item", {
	refresh(frm) {
		frm.trigger("toggle_fields_based_on_checkboxes");
	},

	is_moulding(frm) {
		if (frm.doc.is_moulding) {
			frm.set_value("is_mould_item", 0);
			frm.set_value("other_than_mould_or_moulding", 0);
		}
		frm.trigger("toggle_fields_based_on_checkboxes");
	},

	is_mould_item(frm) {
		if (frm.doc.is_mould_item) {
			frm.set_value("is_moulding", 0);
			frm.set_value("other_than_mould_or_moulding", 0);
		}
		frm.trigger("toggle_fields_based_on_checkboxes");
	},

	other_than_mould_or_moulding(frm) {
		if (frm.doc.other_than_mould_or_moulding) {
			frm.set_value("is_mould_item", 0);
			frm.set_value("is_moulding", 0);
		}
		frm.trigger("toggle_fields_based_on_checkboxes");
	},

	toggle_fields_based_on_checkboxes(frm) {
		const tabs = [
			"mould_details_tab",
			"rework_and_checking_details_tab",
			"part_specification_tab",
			"packing_details_tab",
		];

		const moulding_fields = [
			"mould_details_section",
			"mould_selection_table",
			"cycle_time",

			"gluing",
			"drilling",
			"def_1_hrs",
			"checking_1_hrs",
			"engraving_in_1hrs",
			"runner_wt",
			"cutting_1_hrs",
			"gross_wt",
			"req_total_box",
			"rework_and_checking_details_section",
			"shot_wt",
			"req_boxsizes",
			"poly_bag_section",
			"standard_pkg_of_polybag",
			"pcs_wt",
			"bending",
			"shift_prod",
			"std_pkg_box",
			"other_operations",
			"part_specification_section",
			"box_packing_section",
			"req_poly_bags_sizes",
			"density",
			"clipping",
		];

		const mould_item_visible_fields = [
			"shape",
			"material_type",
			"no_of_cavity",
			"side_cores",
			"side_cores_qty",
			"hot_runner_system",
			"cold_runner_system",
			"tool_life",
			"total_shots",
			"total_lifecycle_shot",
			"mould_name",
			"mould_ty",
		];

		const mould_item_required_fields = [
			"shape",
			"material_type",
			"no_of_cavity",
			"side_cores",
			"side_cores_qty",
			"hot_runner_system",
			"cold_runner_system",
			"tool_life",
			"total_shots",
			"total_lifecycle_shot",
			"mould_name",
			"mould_ty",
		];

		const all_monitored_fields = [...moulding_fields, ...mould_item_visible_fields, "mould", "cavity"];

		// Reset visibility and mandatory status
		tabs.forEach((tab) => frm.set_df_property(tab, "hidden", 1));
		all_monitored_fields.forEach((field) => {
			frm.set_df_property(field, "hidden", 1);
			frm.set_df_property(field, "reqd", 0);
		});
		frm.set_df_property("mould_selection_table", "reqd", 0);

		if (frm.doc.is_moulding) {
			// Show all tabs
			tabs.forEach((tab) => frm.set_df_property(tab, "hidden", 0));
			// Show moulding fields
			moulding_fields.forEach((field) => frm.set_df_property(field, "hidden", 0));
			// Mandatory table
			frm.set_df_property("mould_selection_table", "reqd", 1);
		} else if (frm.doc.is_mould_item) {
			// Show only mould details tab
			frm.set_df_property("mould_details_tab", "hidden", 0);
			// Show mould details section
			frm.set_df_property("mould_details_section", "hidden", 0);
			// Show mould item fields
			mould_item_visible_fields.forEach((field) => {
				frm.set_df_property(field, "hidden", 0);
			});
			// Make specific mould item fields mandatory
			mould_item_required_fields.forEach((field) => {
				frm.set_df_property(field, "reqd", 1);
			});
		} else if (frm.doc.other_than_mould_or_moulding) {
			// All tabs and fields remain hidden (already reset above)
		} else {
			// None checked - default behavior?
			// The request says "if it is other_than_mould_or_moulding is checked then i want to hide all those fields and tabs"
			// And "if is_moulding checked then fields show tabs=..."
			// If none are checked, we should probably follow the "other_than..." or reset logic.
			// Let's assume hiding is the default if none are checked as well, or show if user wants?
			// Previous code reset everything to visible if both unchecked.
			// But with the new requirement, it seems we only want to show things when specific checkboxes are checked.
			// To be safe, let's keep them hidden if none checked, or maybe visible if that's standard?
			// Actually, usually in Frappe, you want to see standard fields if it's a "normal" item.
			// But these are "Custom" fields.
			// If both were unchecked previously, it reset them to hidden=0 (visible).
			/*
            else {
                // If both unchecked → reset everything (optional)
                frm.set_df_property('mould_selection_table', 'hidden', 0);
                frm.set_df_property('mould_selection_table', 'reqd', 0);

                other_fields.forEach(field => {
                    frm.set_df_property(field, 'hidden', 0);
                    frm.set_df_property(field, 'reqd', 0);
                });
            }
            */
			// I'll stick to making them hidden/reset if none checked for now as per the "hide these if other" logic implies exclusivity.
		}

		frm.refresh_fields();
	},
});
