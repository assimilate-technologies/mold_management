frappe.ui.form.on("Production Plan", {
	refresh: function (frm) {
		add_manage_ops_actions(frm, "po_items");
		add_manage_ops_actions(frm, "sub_assembly_items");
	},
	before_save: function (frm) {
		let errors = [];
		["po_items", "sub_assembly_items"].forEach(field => {
			(frm.doc[field] || []).forEach(item => {
				if (item.operations_data) {
					try {
						let ops = JSON.parse(item.operations_data);
						ops.forEach(op => {
							if (op.is_mould_required && !op.mould) {
								errors.push(__("Table {0}, Row #{1}: Mould is required for operation <b>{2}</b> for item {3}", [
									field === "po_items" ? "Assembly Items" : "Sub Assembly Items",
									item.idx,
									op.operation,
									item.item_name || item.item_code
								]));
							}
							if (op.is_workstation_required && !op.workstation) {
								errors.push(__("Table {0}, Row #{1}: Workstation is required for operation <b>{2}</b> for item {3}", [
									field === "po_items" ? "Assembly Items" : "Sub Assembly Items",
									item.idx,
									op.operation,
									item.item_name || item.item_code
								]));
							}
						});
					} catch (e) {
						// ignore errors here, wait for server if it's really broken
					}
				}
			});
		});

		if (errors.length > 0) {
			frappe.throw({
				title: __("Missing Operations Requirements"),
				message: errors.join("<br>"),
				indicator: "orange"
			});
		}
	}
});

function add_manage_ops_actions(frm, field_name) {
	let grid = frm.fields_dict[field_name].grid;

	// Add pencil icon to each row
	grid.on_grid_refresh = function () {
		grid.add_action_icon("pencil", function (cdt, cdn) {
			show_operations_popup(frm, cdt, cdn);
		});
	};
}

frappe.ui.form.on("Production Plan Item", {
	bom_no: function (frm, cdt, cdn) {
		fetch_bom_operations(frm, cdt, cdn);
	},
	form_render: function (frm, cdt, cdn) {
		render_operations_html(frm, cdt, cdn);
	},
});

frappe.ui.form.on("Production Plan Sub Assembly Item", {
	bom_no: function (frm, cdt, cdn) {
		fetch_bom_operations(frm, cdt, cdn);
	},
	form_render: function (frm, cdt, cdn) {
		render_operations_html(frm, cdt, cdn);
	},
});

function show_operations_popup(frm, cdt, cdn) {
	let row = frappe.get_doc(cdt, cdn);
	let ops = [];
	try {
		ops = JSON.parse(row.operations_data || "[]");
	} catch (e) {
		ops = [];
	}

	let d = new frappe.ui.Dialog({
		title: __("Operations for {0}", [row.item_code]),
		fields: [
			{
				fieldname: "fetch_from_bom",
				fieldtype: "Button",
				label: __("Fetch from BOM"),
				click: function () {
					fetch_bom_operations_for_popup(frm, cdt, cdn, d);
				},
			},
			{
				fieldname: "ops_html",
				fieldtype: "HTML",
			},
		],
		primary_action_label: __("Update"),
		primary_action: function () {
			if (frm.doc.docstatus === 1) {
				d.hide();
				return;
			}
			frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
			render_operations_html(frm, cdt, cdn, true);
			d.hide();
		},
	});

	    render_ops_in_dialog(ops, d, frm, cdt, cdn);
	d.show();
}

function render_ops_in_dialog(ops, d, frm, cdt, cdn) {
	let wrapper = $(d.fields_dict.ops_html.wrapper).empty();
	if (ops.length === 0) {
		wrapper.html(
			'<p class="text-muted">No operations found. Click "Fetch from BOM" to load them.</p>',
		);
		return;
	}

	let html = `
        <table class="table table-bordered table-condensed">
        <thead>
            <tr>
                <th style="width: 20%">Operation</th>
                <th style="width: 10%">Workstation Req</th>
                <th style="width: 15%">Workstation</th>
                <th style="width: 10%">Mould Req</th>
                <th style="width: 15%">Mould</th>
                <th style="width: 10%">QI Req</th>
                <th style="width: 20%">QI Template</th>
            </tr>
        </thead>
        <tbody>`;

	ops.forEach((op, idx) => {
		html += `<tr data-idx="${idx}">
            <td style="vertical-align: middle;"><b>${op.operation || ""}</b></td>
            <td class="ws-req-col" style="text-align: center; vertical-align: middle;"></td>
            <td class="ws-col"></td>
            <td class="mould-req-col" style="text-align: center; vertical-align: middle;"></td>
            <td class="mould-col"></td>
            <td class="qi-req-col" style="text-align: center; vertical-align: middle;"></td>
            <td class="qi-col"></td>
        </tr>`;
	});

	html += `</tbody></table>`;
	wrapper.html(html);

	ops.forEach((op, idx) => {
		let tr = wrapper.find(`tr[data-idx="${idx}"]`);

		function update_warning() {
			let current_op = ops[idx];
			let ws_td = tr.find(".ws-col");
			let mould_td = tr.find(".mould-col");
			let qi_td = tr.find(".qi-col");
			
			ws_td.find(".text-danger").remove();
			mould_td.find(".text-danger").remove();
			qi_td.find(".text-danger").remove();

			if (current_op.is_workstation_required && !current_op.workstation) {
				ws_td.append('<div class="text-danger small" style="margin-top: 5px;">Workstation is required.</div>');
			}
			if (current_op.is_mould_required && !current_op.mould) {
				mould_td.append('<div class="text-danger small" style="margin-top: 5px;">Mould is required.</div>');
			}
			if (current_op.is_quality_inspection_required && !current_op.quality_inspection_template) {
				qi_td.append('<div class="text-danger small" style="margin-top: 5px;">QI Template is required.</div>');
			}
		}

		let ws_req_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Check",
				fieldname: "is_workstation_required_" + idx,
				read_only: 0,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].is_workstation_required = this.get_value();
					update_warning();
				},
			},
			parent: tr.find(".ws-req-col"),
			only_input: true,
		});
		ws_req_ctrl.make_input();
		ws_req_ctrl.set_value(op.is_workstation_required);

		let ws_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				options: "Workstation",
				fieldname: "workstation_" + idx,
				read_only: frm.doc.docstatus === 1,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].workstation = this.get_value();
					update_warning();
				},
			},
			parent: tr.find(".ws-col"),
			only_input: true,
		});
		ws_ctrl.make_input();
		ws_ctrl.set_value(op.workstation);

		let mould_req_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Check",
				fieldname: "is_mould_required_" + idx,
				read_only: 0,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].is_mould_required = this.get_value();
					update_warning();
				},
			},
			parent: tr.find(".mould-req-col"),
			only_input: true,
		});
		mould_req_ctrl.make_input();
		mould_req_ctrl.set_value(op.is_mould_required);

		let mould_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				options: "Mould",
				fieldname: "mould_" + idx,
				read_only: frm.doc.docstatus === 1,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].mould = this.get_value();
					update_warning();
				},
			},
			parent: tr.find(".mould-col"),
			only_input: true,
		});
		mould_ctrl.make_input();
		mould_ctrl.set_value(op.mould);

		let qi_req_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Check",
				fieldname: "is_quality_inspection_required_" + idx,
				read_only: 0,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].is_quality_inspection_required = this.get_value();
					update_warning();
				},
			},
			parent: tr.find(".qi-req-col"),
			only_input: true,
		});
		qi_req_ctrl.make_input();
		qi_req_ctrl.set_value(op.is_quality_inspection_required);

		let qi_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				options: "Quality Inspection Template",
				fieldname: "quality_inspection_template_" + idx,
				read_only: frm.doc.docstatus === 1,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].quality_inspection_template = this.get_value();
					update_warning();
				},
			},
			parent: tr.find(".qi-col"),
			only_input: true,
		});
		qi_ctrl.make_input();
		qi_ctrl.set_value(op.quality_inspection_template);
		
		update_warning();
	});
}

function fetch_bom_operations_for_popup(frm, cdt, cdn, d) {
	let row = frappe.get_doc(cdt, cdn);
	if (!row.bom_no) {
		frappe.msgprint(__("Please select a BOM first."));
		return;
	}

	frappe.call({
		method: "frappe.client.get",
		args: {
			doctype: "BOM",
			name: row.bom_no,
		},
		callback: function (r) {
			if (r.message && r.message.operations) {
				let ops = r.message.operations.map((op) => ({
					operation: op.operation,
					workstation: op.workstation,
					mould: op.mould || "",
					is_mould_required: op.is_mould_required || 0,
					is_workstation_required: op.is_workstation_required || 0,
					is_quality_inspection_required: op.is_quality_inspection_required || 0,
					quality_inspection_template: op.quality_inspection_template || null
				}));
				render_ops_in_dialog(ops, d, frm, cdt, cdn);
				frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
				render_operations_html(frm, cdt, cdn, true);
			}
		},
	});
}

function fetch_bom_operations(frm, cdt, cdn, force_render = false) {
	let row = frappe.get_doc(cdt, cdn);
	if (!row.bom_no) {
		frappe.model.set_value(cdt, cdn, "operations_data", "[]");
		return;
	}

	frappe.call({
		method: "frappe.client.get",
		args: {
			doctype: "BOM",
			name: row.bom_no,
		},
		callback: function (r) {
			if (r.message && r.message.operations) {
				let ops = r.message.operations.map((op) => ({
					operation: op.operation,
					workstation: op.workstation,
					mould: op.mould || "",
					is_mould_required: op.is_mould_required || 0,
					is_workstation_required: op.is_workstation_required || 0,
					is_quality_inspection_required: op.is_quality_inspection_required || 0,
					quality_inspection_template: op.quality_inspection_template || null
				}));
				frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
				if (force_render) {
					render_operations_html(frm, cdt, cdn, true);
				}
			}
		},
	});
}

function render_operations_html(frm, cdt, cdn, skip_auto_fetch = false) {
	let row = frappe.get_doc(cdt, cdn);
	let field_name = cdt === "Production Plan Item" ? "po_items" : "sub_assembly_items";
	let grid_dict = frm.fields_dict[field_name];

	if (!grid_dict || !grid_dict.grid) return;
	let grid_row = grid_dict.grid.grid_rows_by_docname[cdn];
	if (!grid_row || !grid_row.grid_form) return;

	let html_field = grid_row.grid_form.fields_dict.operations_html;
	if (!html_field) return;

	let ops = [];
	try {
		ops = JSON.parse(row.operations_data || "[]");
	} catch (e) {
		ops = [];
	}

	if (ops.length === 0 && row.bom_no && !skip_auto_fetch) {
		fetch_bom_operations(frm, cdt, cdn, true);
		return;
	}

	let wrapper = $(html_field.wrapper).empty();

	if (ops.length === 0) {
		wrapper.html(
			'<p class="text-muted">No operations found. Use the pencil icon to manage.</p>',
		);
		return;
	}

	let html = `
        <label class="control-label">Operations</label>
        <table class="table table-bordered table-condensed">
        <thead>
            <tr>
                <th style="width: 20%">Operation</th>
                <th style="width: 10%">Workstation Req</th>
                <th style="width: 15%">Workstation</th>
                <th style="width: 10%">Mould Req</th>
                <th style="width: 15%">Mould</th>
                <th style="width: 10%">QI Req</th>
                <th style="width: 20%">QI Template</th>
            </tr>
        </thead>
        <tbody>`;

	ops.forEach((op, idx) => {
		html += `<tr data-idx="${idx}">
            <td style="vertical-align: middle;"><b>${op.operation || ""}</b></td>
            <td class="ws-req-col" style="text-align: center; vertical-align: middle;"></td>
            <td class="ws-col"></td>
            <td class="mould-req-col" style="text-align: center; vertical-align: middle;"></td>
            <td class="mould-col"></td>
            <td class="qi-req-col" style="text-align: center; vertical-align: middle;"></td>
            <td class="qi-col"></td>
        </tr>`;
	});

	html += `</tbody></table>`;
	let table = $(html).appendTo(wrapper);

	ops.forEach((op, idx) => {
		let tr = wrapper.find(`tr[data-idx="${idx}"]`);

		function update_warning() {
			let current_op = ops[idx];
			let ws_td = tr.find(".ws-col");
			let mould_td = tr.find(".mould-col");
			let qi_td = tr.find(".qi-col");
			
			ws_td.find(".text-danger").remove();
			mould_td.find(".text-danger").remove();
			qi_td.find(".text-danger").remove();

			if (current_op.is_workstation_required && !current_op.workstation) {
				ws_td.append('<div class="text-danger small" style="margin-top: 5px;">Workstation is required.</div>');
			}
			if (current_op.is_mould_required && !current_op.mould) {
				mould_td.append('<div class="text-danger small" style="margin-top: 5px;">Mould is required.</div>');
			}
			if (current_op.is_quality_inspection_required && !current_op.quality_inspection_template) {
				qi_td.append('<div class="text-danger small" style="margin-top: 5px;">QI Template is required.</div>');
			}
		}

		let ws_req_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Check",
				fieldname: "form_is_workstation_required_" + idx,
				read_only: 0,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].is_workstation_required = this.get_value();
					frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
					update_warning();
				},
			},
			parent: tr.find(".ws-req-col"),
			only_input: true,
		});
		ws_req_ctrl.make_input();
		ws_req_ctrl.set_value(op.is_workstation_required);

		let ws_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				options: "Workstation",
				fieldname: "form_workstation_" + idx,
				read_only: frm.doc.docstatus === 1,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].workstation = this.get_value();
					frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
					update_warning();
				},
			},
			parent: tr.find(".ws-col"),
			only_input: true,
		});
		ws_ctrl.make_input();
		ws_ctrl.set_value(op.workstation);

		let mould_req_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Check",
				fieldname: "form_is_mould_required_" + idx,
				read_only: 0,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].is_mould_required = this.get_value();
					frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
					update_warning();
				},
			},
			parent: tr.find(".mould-req-col"),
			only_input: true,
		});
		mould_req_ctrl.make_input();
		mould_req_ctrl.set_value(op.is_mould_required);

		let mould_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				options: "Mould",
				fieldname: "form_mould_" + idx,
				read_only: frm.doc.docstatus === 1,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].mould = this.get_value();
					frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
					update_warning();
				},
			},
			parent: tr.find(".mould-col"),
			only_input: true,
		});
		mould_ctrl.make_input();
		mould_ctrl.set_value(op.mould);

		let qi_req_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Check",
				fieldname: "form_is_quality_inspection_required_" + idx,
				read_only: 0,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].is_quality_inspection_required = this.get_value();
					frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
					update_warning();
				},
			},
			parent: tr.find(".qi-req-col"),
			only_input: true,
		});
		qi_req_ctrl.make_input();
		qi_req_ctrl.set_value(op.is_quality_inspection_required);

		let qi_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: "Link",
				options: "Quality Inspection Template",
				fieldname: "form_quality_inspection_template_" + idx,
				read_only: frm.doc.docstatus === 1,
				onchange: function () {
					if (frm.doc.docstatus === 1) return;
					ops[idx].quality_inspection_template = this.get_value();
					frappe.model.set_value(cdt, cdn, "operations_data", JSON.stringify(ops));
					update_warning();
				},
			},
			parent: tr.find(".qi-col"),
			only_input: true,
		});
		qi_ctrl.make_input();
		qi_ctrl.set_value(op.quality_inspection_template);

		update_warning();
	});
}

