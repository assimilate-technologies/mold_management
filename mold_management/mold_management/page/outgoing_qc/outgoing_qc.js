frappe.pages["outgoing-qc"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "Outgoing QC Report",
		single_column: true,
	});

	const route_options = frappe.route_options;
	const reference_name = route_options ? route_options.reference_name : "";
	const route_template = route_options ? route_options.quality_inspection_template : "";
	frappe.route_options = null;

	$(`
		<div class="row mb-4 no-print">
			<div class="col-md-4">
				<div id="reference_filter"></div>
			</div>
			<div class="col-md-4">
				<div id="template_filter"></div>
			</div>
			<div class="col-md-4 d-flex align-items-end">
				<button class="btn btn-primary btn-sm me-2" id="btn-refresh" style="margin-bottom: 2px;"><i class="fa fa-refresh"></i> Refresh</button>
				<button class="btn btn-secondary btn-sm" id="btn-print" style="margin-bottom: 2px;"><i class="fa fa-print"></i> Print</button>
			</div>
		</div>
		
		<div id="report-container" class="report-container">
			<p class="text-center text-muted">Initialize Report...</p>
		</div>

		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
			.report-container { background: #f0f2f5; padding: 30px; min-height: 100vh; }
			.inspection-sheet-wrapper { background: #fff; padding: 30px; border: 1px solid #ccc; box-shadow: 0 10px 25px rgba(0,0,0,0.05); margin: 0 auto 40px; max-width: 1400px; color: #000; font-family: 'Inter', sans-serif;}
			.inspection-sheet { width: 100%; border-collapse: collapse; margin-bottom: -1px; }
			.inspection-sheet th, .inspection-sheet td { border: 1px solid #000; padding: 5px 8px; vertical-align: middle;}
			.header-label { font-weight: 700; background-color: #f9f9f9; font-size: 10px; color: #333; }
			.header-value { font-size: 11px; }
			.logo-text { font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #000; }
			.sheet-title { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; }
			.table-header th { background: #f4f4f4; font-weight: 700; font-size: 10px; text-transform: uppercase; text-align: center;}
			.param-row td { font-size: 10px; }
			.text-center { text-align: center; }
			.text-bold { font-weight: 700; }
			.status-rejected { color: #d00; font-weight: 700; }
			
			@media print {
				@page { size: A4 landscape; margin: 5mm; }
				.no-print { display: none !important; }
				.report-container { padding: 0; background: #fff; height: auto !important; min-height: 0 !important; }
				.inspection-sheet-wrapper { padding: 0; border: none; box-shadow: none; margin: 0; width: 100%; max-width: none; }
				body { background: #fff !important; margin: 0; padding: 0; }
				.inspection-sheet th, .inspection-sheet td { border: 1px solid #000 !important; padding: 2px 4px !important; font-size: 8px !important; line-height: 1.1 !important; }
				.logo-text { font-size: 16px !important; font-weight: 800 !important; }
				.sheet-title { font-size: 14px !important; }
			}
		</style>
	`).appendTo(page.body);

	const field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#reference_filter"),
		df: {
			label: "Quality Inspection / Delivery Note",
			fieldname: "reference_name",
			fieldtype: "Link",
			options: "Quality Inspection",
			get_query: () => ({ filters: { inspection_type: "Final" } }),
			default: reference_name,
			onchange: () => load_report_data(),
		},
		render_input: true,
	});

	const template_field = frappe.ui.form.make_control({
		parent: $(wrapper).find("#template_filter"),
		df: {
			label: "Quality Inspection Template",
			fieldname: "quality_inspection_template",
			fieldtype: "Link",
			options: "Quality Inspection Template",
			get_query: () => ({ filters: { inspection_type: "Final" } }),
			default: route_template,
			onchange: () => load_report_data(),
		},
		render_input: true,
	});

	$(wrapper).find("#btn-refresh").on("click", () => load_report_data());
	$(wrapper).find("#btn-print").on("click", () => window.print());

	load_report_data();

	async function load_report_data() {
		const ref = field && typeof field.get_value === "function" ? field.get_value() : "";
		const template = template_field && typeof template_field.get_value === "function" ? template_field.get_value() : null;
		$(wrapper).find("#report-container").html('<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Generating Report...</p></div>');

		try {
			const res = await frappe.call({
				method: "mold_management.mold_management.page.outgoing_qc.outgoing_qc.get_report_data",
				args: { reference_name: ref, quality_inspection_template: template },
			});
			if (!res.message || !res.message.length) {
				$(wrapper).find("#report-container").html('<div class="alert alert-warning text-center">No data found.</div>');
				return;
			}
			render_report(res.message);
		} catch (err) {
			console.error(err);
			$(wrapper).find("#report-container").html('<div class="alert alert-danger">Error fetching report data.</div>');
		}
	}

	function render_report(sheets) {
		const container = $("#report-container").empty();
		sheets.forEach((sheet, idx) => {
			container.append(build_sheet_html(sheet));
			if (idx < sheets.length - 1) container.append('<div class="page-break"></div>');
		});
	}

	function build_sheet_html(data) {
		const qi = data.qi;
		const item = data.item;
		const parameters = data.parameters;
		
		const empty_cols = Array(Math.max(0, 5)).fill({});
		const all_cols = [qi].concat(empty_cols.slice(1));
		const dynamic_headers = all_cols.map((q, i) => `<th class="text-center">${i + 1}</th>`).join("");

		return `
			<div class="inspection-sheet-wrapper">
				<table class="inspection-sheet">
					<tr>
						<td rowspan="2" class="text-center" style="width: 12%;"><div class="logo-text">EXIDE</div></td>
						<td colspan="4" rowspan="2" class="text-center"><h1 class="sheet-title">Outgoing QC inspection sheet</h1></td>
						<td class="header-label">Doc No:</td><td class="header-value">YPEW / QA / OUT - 01</td>
					</tr>
					<tr>
						<td class="header-label text-bold">Rev/Date:</td><td class="header-value">01 / ${data.today}</td>
					</tr>
					<tr>
						<td class="header-label">Customer :</td><td colspan="2" class="header-value text-bold">${qi.customer || ""}</td>
						<td class="header-label">Item Code :</td><td class="header-value">${qi.item_code}</td>
						<td class="header-label">Item Name :</td><td class="header-value">${item.item_name || ""}</td>
					</tr>
					<tr>
						<td class="header-label">Delivery Note:</td><td colspan="2" class="header-value">${qi.reference_name || ""}</td>
						<td class="header-label">Batch No:</td><td class="header-value">${qi.batch_no || ""}</td>
						<td class="header-label">Model:</td><td class="header-value">${item.model || ""}</td>
					</tr>
				</table>
				<table class="inspection-sheet" style="margin-top: -1px;">
					<thead><tr class="table-header"><th rowspan="2">Sr.no</th><th rowspan="2">Parameters</th><th rowspan="2">Specification and Tolerance</th><th rowspan="2">Equipment...</th><th colspan="${all_cols.length}">Observation</th><th rowspan="2">Remark</th></tr>
					<tr class="table-header">${dynamic_headers}</tr></thead>
					<tbody>${render_params(parameters, [qi], all_cols.length)}</tbody>
				</table>
				<table class="inspection-sheet" style="margin-top: -1px; table-layout: fixed;">
					<tr><td rowspan="3" class="header-label text-center">QC INSPECTOR</td><td class="header-label">Signature:</td><td></td><td rowspan="3" class="header-label text-center">FINAL APPROVAL</td><td class="header-label">Signature:</td><td></td></tr>
					<tr><td class="header-label">Name:</td><td></td><td class="header-label">Name:</td><td></td></tr>
					<tr><td class="header-label">Date:</td><td></td><td class="header-label">Date:</td><td></td></tr>
				</table>
			</div>`;
	}

	function render_params(params, inspections, total_display_cols) {
		return params.map((p, i) => {
			let criteria = (p.acceptance_criteria || p.acceptance_criteria_value || p.value || "").trim();
			let range = (p.min_value && p.max_value) ? `${(flt(p.min_value)+flt(p.max_value))/2} \u00B1 ${(flt(p.max_value)-flt(p.min_value))/2}` : "";
			let spec = (criteria && range && criteria.toLowerCase() !== range.toLowerCase()) ? `${criteria} (${range})` : (criteria || range || "-");
			let cells = "";
			for (let j = 0; j < total_display_cols; j++) {
				const qi = inspections[j];
				let val = "-";
				if (qi && qi.readings) {
					const r = qi.readings.find(r => r.specification === p.specification);
					val = r ? (r.reading_1 || r.reading_value || "-") : "-";
				}
				cells += `<td class="text-center">${val}</td>`;
			}
			return `<tr class="param-row"><td class="text-center">${i+1}</td><td>${p.specification}</td><td class="text-center">${spec}</td><td class="text-center">${p.equipment || ""}</td>${cells}<td class="text-center">ok</td></tr>`;
		}).join("");
	}
};
