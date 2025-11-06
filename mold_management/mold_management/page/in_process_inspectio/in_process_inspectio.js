frappe.pages['in-process-inspectio'].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'In Process Quality Inspection',
		single_column: true
	});

	$(`
		<div class="row mb-4">
			<div class="col-md-2"><input type="date" class="form-control" id="from_date"></div>
			<div class="col-md-2"><input type="date" class="form-control" id="to_date"></div>
			<div class="col-md-2"><select class="form-control" id="filter_item"><option value="">Item Code</option></select></div>
			<div class="col-md-2"><select class="form-control" id="filter_reference"><option value="">Reference Name</option></select></div>
			<div class="col-md-2"><select class="form-control" id="filter_shift"><option value="">Shift Type</option></select></div>
			<div class="col-md-2"><button class="btn btn-primary" id="btn-refresh">Refresh</button></div>
		</div>
		
		<div id="inspection-tables"></div>
		<div id="pagination-controls" class="text-center mt-3"></div>
	`).appendTo(page.body);

	let shift_start = 8, shift_end = 20;
	let records_all = [], current_page = 1, page_size = 10;
	let parameter_map = {};

	$('#btn-refresh').on('click', () => load_data());

	load_shift_types(() => {
		load_parameters(() => {
			load_data();
		});
	});

	function load_parameters(callback) {
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Quality Inspection Parameter",
				fields: ["name", "parameter", "parameter_group"],
				limit: 1000
			},
			callback({ message }) {
				parameter_map = {};
				message.forEach(row => {
					parameter_map[row.name] = row.parameter_group;
				});
				callback && callback();
			}
		});
	}

	function load_shift_types(callback) {
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Shift Type",
				fields: ["name", "start_time", "end_time"],
				limit: 1000
			},
			callback({ message }) {
				const shiftSelect = $('#filter_shift')
					.empty()
					.append(`<option value="">Default (08:00–20:00)</option>`);

				message.forEach(({ name, start_time, end_time }) => {
					shiftSelect.append(
						`<option value="${name}" data-start="${start_time}" data-end="${end_time}">${name}</option>`
					);
				});

				$('#filter_shift').on('change', () => {
					const selected = $('#filter_shift option:selected');
					if (selected.val()) {
						shift_start = parseInt(selected.data('start').split(':')[0]) || 8;
						shift_end = parseInt(selected.data('end').split(':')[0]) || 20;
						if (shift_end === 0) shift_end = 24;
					} else {
						shift_start = 8;
						shift_end = 20;
					}
					load_data();
				});

				callback && callback();
			}
		});
	}

	function load_data() {
		const filters = {
			reference_type: "Job Card",
			...(getDateFilter()),
			...(getItemFilter()),
			...(getReferenceFilter())
		};

		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "Quality Inspection",
				fields: ["name", "reference_name", "item_code", "custom_time", "report_date"],
				filters,
				order_by: "reference_name asc, report_date asc, custom_time asc",
				limit: 1000
			},
			callback({ message }) {
				if (!message.length) {
					$('#inspection-tables').html('<p class="text-center">No records found</p>');
					$('#pagination-controls').empty();
					return;
				}

				records_all = message;
				current_page = 1;

				populate_dropdowns(message);
				render_page();
			}
		});
	}

	function getDateFilter() {
		const from = $('#from_date').val();
		const to = $('#to_date').val();
		return (from && to) ? { report_date: ["between", [from, to]] } : {};
	}

	function getItemFilter() {
		const item = $('#filter_item').val();
		return item ? { item_code: item } : {};
	}

	function getReferenceFilter() {
		const ref = $('#filter_reference').val();
		return ref ? { reference_name: ref } : {};
	}

	function populate_dropdowns(records) {
		const items = new Set(), refs = new Set();

		records.forEach(r => {
			if (r.item_code) items.add(r.item_code);
			if (r.reference_name) refs.add(r.reference_name);
		});

		const itemSelect = $('#filter_item').empty().append(`<option value="">Item Code</option>`);
		const refSelect = $('#filter_reference').empty().append(`<option value="">Reference Name</option>`);

		items.forEach(i => itemSelect.append(`<option value="${i}">${i}</option>`));
		refs.forEach(r => refSelect.append(`<option value="${r}">${r}</option>`));
	}

	function render_page() {
		const start = (current_page - 1) * page_size;
		const end = start + page_size;
		const page_records = records_all.slice(start, end);
		process_records(page_records);
		render_pagination_controls();
	}

	function render_pagination_controls() {
		const total_pages = Math.ceil(records_all.length / page_size);
		const pagination = $('#pagination-controls').empty();

		pagination.append(`<button class="btn btn-sm btn-secondary" ${current_page === 1 ? 'disabled' : ''} id="prev-page">Prev</button>`);
		pagination.append(` <span> Page ${current_page} of ${total_pages} </span> `);
		pagination.append(`<button class="btn btn-sm btn-secondary" ${current_page === total_pages ? 'disabled' : ''} id="next-page">Next</button>`);

		$('#prev-page').on('click', () => { if (current_page > 1) { current_page--; render_page(); } });
		$('#next-page').on('click', () => { if (current_page < total_pages) { current_page++; render_page(); } });
	}

	function process_records(records) {
		const groupedData = {};
		const outOfShift = {};
		let completed = 0;

		records.forEach(doc => {
			frappe.call({
				method: "frappe.client.get",
				args: { doctype: "Quality Inspection", name: doc.name },
				callback({ message: { readings = [] } }) {
					completed++;

					groupedData[doc.reference_name] ||= { Dimensional: {}, Visual: {} };
					outOfShift[doc.reference_name] ||= [];

					readings.forEach(reading => {
						const slot = getSlotLabel(doc.report_date, doc.custom_time);
						const time = `${doc.report_date} ${doc.custom_time}`;
						const param_group = parameter_map[reading.specification] || 'Unknown';

						if (!slot) {
							outOfShift[doc.reference_name].push({
								specification: reading.specification,
								reading_value: reading.reading_value,
								reading_1: reading.reading_1,
								time,
								parameter_group: param_group
							});
							return;
						}

						if (!groupedData[doc.reference_name][param_group]) {
							groupedData[doc.reference_name][param_group] = {};
						}

						groupedData[doc.reference_name][param_group][reading.specification] ||= {};
						groupedData[doc.reference_name][param_group][reading.specification][slot] =
							reading.reading_value || reading.reading_1 || '-';
					});

					if (completed === records.length) {
						renderTables(groupedData, outOfShift);
					}
				}
			});
		});
	}

	function renderTables(groupedData, outOfShift) {
		const container = $('#inspection-tables').empty();
		const slots = getTimeSlots();

		Object.keys(groupedData).forEach(ref => {
			frappe.call({
				method: "frappe.client.get",
				args: {
					doctype: "Job Card",
					name: ref,
					fields: ["operation"]
				},
				callback({ message }) {
					let title = frappe.utils.escape_html(ref);
					if (message?.operation) {
						title += ` — ${frappe.utils.escape_html(message.operation)}`;
					}

					const card = $(`
						<div class="card mb-3">
							<div class="card-header">
								<h4 class="mb-0">${title}</h4>
							</div>
							<div class="card-body"></div>
						</div>
					`);
					const cardBody = card.find('.card-body');

					['Dimensional', 'Visual'].forEach(group => {
						if (Object.keys(groupedData[ref][group] || {}).length) {
							cardBody.append(`<h4>${group} Parameters</h4>`);
							cardBody.append(renderTable(groupedData[ref][group], slots));
						}
					});

					if (outOfShift[ref]?.length) {
						cardBody.append(`<h5 class="text-danger mt-3">Out of Shift Readings</h5>`);
						cardBody.append(renderOutOfShiftTable(outOfShift[ref]));
					}

					container.append(card);
				}
			});
		});
	}

	function renderTable(data, slots) {
		const tbl = $('<div class="table-responsive"><table class="table table-bordered table-sm"></table></div>');
		const table = tbl.find('table');

		let thead = `<thead><tr><th>Specification</th>`;
		slots.forEach(slot => thead += `<th>${slot}</th>`);
		thead += `</tr></thead>`;
		table.append(thead);

		const tbody = $('<tbody></tbody>');
		Object.entries(data).forEach(([spec, values]) => {
			let row = `<tr><td>${frappe.utils.escape_html(spec)}</td>`;
			slots.forEach(slot => {
				row += `<td>${values[slot] || '-'}</td>`;
			});
			row += `</tr>`;
			tbody.append(row);
		});
		table.append(tbody);

		return tbl;
	}

	function renderOutOfShiftTable(records) {
		const tbl = $('<div class="table-responsive"><table class="table table-bordered table-sm"></table></div>');
		const table = tbl.find('table');

		const thead = `
			<thead>
				<tr><th>Parameter Group</th><th>Specification</th><th>Reading Value</th><th>Reading 1</th><th>Time</th></tr>
			</thead>`;
		table.append(thead);

		const tbody = $('<tbody></tbody>');
		records.forEach(r => {
			tbody.append(`
				<tr>
					<td>${frappe.utils.escape_html(r.parameter_group)}</td>
					<td>${frappe.utils.escape_html(r.specification)}</td>
					<td>${frappe.utils.escape_html(r.reading_value || '-')}</td>
					<td>${frappe.utils.escape_html(r.reading_1 ?? '-')}</td>
					<td>${frappe.utils.escape_html(r.time)}</td>
				</tr>`);
		});
		table.append(tbody);

		return tbl;
	}

	function getTimeSlots() {
		const slots = [];
		for (let h = shift_start; h < shift_end; h++) {
			const start = formatHour(h);
			const end = formatHour(h + 1);
			slots.push(`${start} - ${end}`);
		}
		return slots;
	}

	function formatHour(hour) {
		return `${hour.toString().padStart(2, '0')}:00`;
	}

	function getSlotLabel(report_date, custom_time) {
		if (!report_date || !custom_time) return null;

		const dt = frappe.datetime.str_to_obj(`${report_date} ${custom_time}`);
		if (!dt) return null;

		const hour = dt.getHours();
		if (hour < shift_start || hour >= shift_end) return null;

		const nextHour = hour + 1;
		return `${formatHour(hour)} - ${formatHour(nextHour)}`;
	}
};
