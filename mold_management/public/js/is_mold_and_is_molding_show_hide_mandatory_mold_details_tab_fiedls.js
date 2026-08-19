

frappe.ui.form.on("Item", {
	refresh(frm) {
		frm.trigger("toggle_fields_based_on_checkboxes");

		frm.set_query("req_poly_bags_sizes", function () {
			return {
				filters: {
					"item_sub_group": "Polybags"
				}
			};
		});

		frm.set_query("req_boxsizes", function () {
			return {
				filters: {
					"item_sub_group": "Box"
				}
			};
		});
	},

	validate(frm) {
		frm.set_df_property("mould_selection_table", "reqd", 0);
		frm.set_df_property("mould", "reqd", 0);
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
		const all_tabs = [
			"mould_details_tab",
			"rework_and_checking_details_tab",
			"part_specification_tab",
			"packing_details_tab",
		];

		const moulding_tabs = [
			"mould_details_tab",
			"rework_and_checking_details_tab",
			"part_specification_tab",
			"packing_details_tab",
		];

		const moulding_fields = [
			"mould_selection_table",
			"mould_details_section",
			"cycle_time",
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
			"cavity",
			"pcs_wt",
			"std_pkg_box",
			"part_specification_section",
			"box_packing_section",
			"req_poly_bags_sizes",
			"other_operations",
			"drilling",
			"gluing",
			"bending",
			"clipping",
		];

		const moulding_required_fields = [
			"cycle_time",
			"def_1_hrs",
			"checking_1_hrs",
			"engraving_in_1hrs",
			"runner_wt",
			"cutting_1_hrs",
			"gross_wt",
			"req_total_box",
			"shot_wt",
			"req_boxsizes",
			"standard_pkg_of_polybag",
			"cavity",
			"pcs_wt",
			"std_pkg_box",
			"req_poly_bags_sizes",
			"drilling",
			"gluing",
			"bending",
			"clipping",
		];

		const mould_item_fields = [
			// "shape",
			// "material_type",
			"no_of_cavity",
			"side_cores",
			"side_cores_qty",
			"hot_runner_system",
			"cold_runner_system",
			"tool_life",
			"total_shots",
			"total_lifecycle_shot",
			"mould_details_section",
			"mould",
			"other_operations",
			"mould_name",
			"mould_ty",
		];

		const mould_item_required_fields = [
			// "shape",
			// "material_type",
			"no_of_cavity",
			"side_cores",
			"side_cores_qty",
			"hot_runner_system",
			"cold_runner_system",
			"tool_life",
			"total_shots",
			"total_lifecycle_shot",
			"mould",
			"mould_name",
			"mould_ty",
		];

		const mould_item_tabs = [
			"mould_details_tab",
			"part_specification_tab",
		];

		const all_monitored_fields = Array.from(new Set([
			...moulding_fields,
			...mould_item_fields,
		]));

		const hideTab = (tab) => {
			frm.set_df_property(tab, "hidden", 1);
			frm.toggle_display(tab, false);
		};

		const showTab = (tab) => {
			frm.set_df_property(tab, "hidden", 0);
			frm.toggle_display(tab, true);
		};

		const hideField = (field) => {
			frm.set_df_property(field, "hidden", 1);
			frm.set_df_property(field, "reqd", 0);
			frm.toggle_display(field, false);
		};

		const showField = (field) => {
			frm.set_df_property(field, "hidden", 0);
			frm.toggle_display(field, true);
		};

		const setRequired = (field) => {
			frm.set_df_property(field, "reqd", 1);
		};

		all_tabs.forEach(hideTab);
		all_monitored_fields.forEach(hideField);
		hideField("shift_prod");

		if (frm.doc.is_moulding) {
			moulding_tabs.forEach(showTab);
			moulding_fields.forEach(showField);
			moulding_required_fields.forEach(setRequired);
			frm.set_df_property("mould_selection_table", "reqd", 0);
		} else if (frm.doc.is_mould_item) {
			mould_item_tabs.forEach(showTab);
			mould_item_fields.forEach(showField);
			mould_item_required_fields.forEach(setRequired);
			frm.set_df_property("mould_selection_table", "hidden", 1);
			frm.set_df_property("mould_selection_table", "reqd", 0);
			frm.toggle_display("mould_selection_table", false);
		} else if (frm.doc.other_than_mould_or_moulding) {
			frm.set_df_property("mould_selection_table", "hidden", 1);
			frm.set_df_property("mould_selection_table", "reqd", 0);
			frm.toggle_display("mould_selection_table", false);
		}

		frm.set_df_property("mould", "reqd", 0);
		frm.refresh_fields();
	},
});
