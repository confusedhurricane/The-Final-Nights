/**
 * Pyxis MedStation
 */

// Sound defines for Pyxis MedStation
#define PYXIS_SOUND_LOGIN 'sound/machines/terminal_success.ogg'
#define PYXIS_SOUND_LOGOUT 'sound/machines/terminal_off.ogg'
#define PYXIS_SOUND_DISPENSE 'sound/machines/terminal_insert_disc.ogg'
#define PYXIS_SOUND_RESTOCK 'sound/machines/click.ogg'
#define PYXIS_SOUND_MONEY 'sound/machines/ping.ogg'
#define PYXIS_SOUND_ERROR 'sound/machines/buzz-sigh.ogg'
#define PYXIS_SOUND_WARNING 'sound/machines/warning-buzzer.ogg'

/obj/clinic_machine/pyxis
	name = "Pyxis MedStation - St. John's Community Clinic"
	desc = "An automated medication and supply dispensing terminal. For authorized clinical use only."
	icon = 'code/modules/wod13/props.dmi'
	icon_state = "pyxis"
	density = TRUE
	anchored = TRUE

	// Authentication variables
	var/logged_in = FALSE
	var/obj/item/card/id/scan = null
	var/mob/living/current_user = null
	var/session_started = 0
	var/session_timeout = 5 MINUTES
	var/user_access = 0

	// Stock management
	var/list/machine_stock = list()
	var/list/cart = list()

	// Money handling
	var/stored_money = 0

	// Records
	var/list/transaction_log = list()
	var/list/access_override_log = list()
	var/list/emergency_mode_log = list()
	var/emergency_mode = FALSE
	var/locked = FALSE

	// UI state
	var/selected_category = "Medical Supplies"
	var/selected_reason = null
	var/dispensing_notes = ""
	var/patient_name = ""

	// Access override state
	var/access_override = FALSE
	var/override_physician = ""
	var/override_reason = ""
	var/list/overridden_categories = list()

	// UI messages
	var/list/ui_messages = list()
	var/list/acknowledged_messages = list()

/obj/clinic_machine/pyxis/Initialize(mapload)
	. = ..()
	machine_stock = GLOB.CLINIC_stock.Copy()
	START_PROCESSING(SSobj, src)

/obj/clinic_machine/pyxis/process(seconds_per_tick)
	if(logged_in && (world.time - session_started) > session_timeout)
		logout_user()

/obj/clinic_machine/pyxis/attack_hand(mob/user)
	. = ..()
	if(.)
		return
	if(locked)
		ui_messages += list("System Alert: This MedStation is locked. Please contact clinical administration.")
		playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
		ui_interact(user)
		return
	ui_interact(user)

/obj/clinic_machine/pyxis/proc/logout_user()
	if(!logged_in)
		return

	// Log logout
	if(scan)
		transaction_log += list(list(
			"timestamp" = station_time_timestamp(),
			"type" = "logout",
			"user" = (scan?.registered_name || "Unknown"),
			"user_job" = (scan?.assignment || "Unknown")
		))

	logged_in = FALSE
	current_user = null
	scan = null
	session_started = 0
	user_access = 0
	selected_reason = null
	dispensing_notes = ""
	cart.Cut()
	access_override = FALSE
	override_physician = ""
	override_reason = ""
	overridden_categories.Cut()
	playsound(src, PYXIS_SOUND_LOGOUT, 30, TRUE)

/obj/clinic_machine/pyxis/attackby(obj/item/I, mob/user, params)
	if(istype(I, /obj/item/card/id))
		var/obj/item/card/id/id_card = I
		var/job = id_card.assignment
		if(!GLOB.CLINIC_job_access[job])
			ui_messages += list("Access Denied: User authentication failed. Authorized clinical staff only.")
			playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
			ui_interact(user)
			return
		scan = id_card
		current_user = user
		logged_in = TRUE
		session_started = world.time
		user_access = GLOB.CLINIC_job_access[job]
		ui_messages += list("Authentication successful. Welcome, [scan ? scan.registered_name : "Unknown"]. Pyxis MedStation ready for use.")
		playsound(src, PYXIS_SOUND_LOGIN, 30, TRUE)

		// Log login
		add_login_log(id_card.registered_name, job)

		ui_interact(user)
		return
	if(istype(I, /obj/item/stack/dollar))
		var/obj/item/stack/dollar/D = I
		stored_money += D.amount
		ui_messages += list("[D.amount] dollars added to MedStation account. Current balance: [stored_money] dollars.")
		playsound(src, PYXIS_SOUND_MONEY, 30, TRUE)

		// Log deposit
		transaction_log += list(list(
			"timestamp" = station_time_timestamp(),
			"type" = "deposit",
			"user" = (user?.real_name || "Unknown"),
			"user_job" = (scan?.assignment || "Unknown"),
			"amount" = D.amount,
			"balance" = stored_money
		))
		qdel(D)
		ui_interact(user)
		return
	return ..()

/obj/clinic_machine/pyxis/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "Pyxis", name)
		ui.open()

/obj/clinic_machine/pyxis/ui_data(mob/user)
	var/list/data = list()
	data["banner"] = "<b>Pyxis MedStation</b><br>St. John's Community Clinic<br><i>Automated Medication & Supply Dispensing</i>"
	data["reminder"] = "This system is for authorized clinical use only. All transactions are logged. Please return unused items to inventory."
	data["logged_in"] = logged_in
	data["emergency_mode"] = emergency_mode
	data["stored_money"] = stored_money
	if(scan)
		var/job_display = scan.assignment
		if(job_display == "Malkavian Primogen")
			job_display = "Hospital Administrator"
		data["user_name"] = scan.registered_name
		data["user_job"] = job_display
		data["user_access"] = user_access
	else
		data["user_name"] = "Unknown"
		data["user_job"] = "Unknown"
		data["user_access"] = 0
	data["categories"] = list()
	if(logged_in)
		for(var/category in machine_stock)
			data["categories"] += category
		data["selected_category"] = selected_category
		var/list/items = list()
		var/static/list/icon_cache = list()
		if(selected_category && machine_stock[selected_category])
			var/has_access = FALSE
			if(scan)
				has_access = CLINIC_has_category_access(scan.assignment, selected_category) || emergency_mode || (access_override && (selected_category in overridden_categories))
			else
				has_access = emergency_mode

			for(var/i = 1, i <= length(machine_stock[selected_category]), i++)
				var/list/item_data = machine_stock[selected_category][i]
				var/item_access = has_access
				var/list/item = list(
					"id" = i,
					"name" = item_data["name"],
					"stock" = item_data["stock"],
					"restricted" = (GLOB.CLINIC_category_access[selected_category] > CLINIC_ACCESS_BASIC),
					"path" = item_data["path"],
					"has_access" = item_access
				)

				var/type = item_data["path"]
				if(!icon_cache[type]) {
					var/atom/temp = new type
					icon_cache[type] = icon2base64(icon(temp.icon, temp.icon_state))
					qdel(temp)
				}
				item["icon"] = icon_cache[type]
				items += list(item)
			data["items"] = items
			data["category_access"] = has_access
		var/list/cart_data = list()
		for(var/i = 1, i <= length(cart), i++)
			var/list/cart_item = cart[i]
			cart_data += list(list(
				"id" = i,
				"name" = cart_item["name"],
				"category" = cart_item["category"],
				"amount" = cart_item["amount"],
				"icon" = icon_cache[cart_item["path"]]
			))
		data["cart"] = cart_data
		data["has_controlled"] = has_controlled_in_cart()
		data["reasons"] = GLOB.CLINIC_reasons
		data["selected_reason"] = selected_reason
		data["notes"] = dispensing_notes
		data["is_admin"] = (user_access == CLINIC_ACCESS_ADMIN)
		var/list/restock_data = list()
		for(var/category in machine_stock)
			for(var/i = 1, i <= length(machine_stock[category]), i++)
				var/list/item_data = machine_stock[category][i]
				if(item_data["stock"] < 5)
					var/type = item_data["path"]
					restock_data += list(list(
						"id" = i,
						"name" = item_data["name"],
						"category" = category,
						"stock" = item_data["stock"],
						"cost" = calculate_restock_cost(category, i, item_data["stock"]),
						"base_cost" = item_data["cost"],
						"icon" = icon_cache[type]
					))
		data["restock_items"] = restock_data

	data["messages"] = ui_messages.Copy()

	if(!islist(data["categories"])) data["categories"] = list()
	if(!islist(data["items"])) data["items"] = list()
	if(!islist(data["cart"])) data["cart"] = list()
	if(!islist(data["reasons"])) data["reasons"] = list()
	if(!islist(data["restock_items"])) data["restock_items"] = list()

	var/list/transaction_log_entries = list()
	for(var/entry in transaction_log)
		if(islist(entry))
			transaction_log_entries += list(entry)
	data["transaction_log"] = transaction_log_entries

	var/list/access_override_log_entries = list()
	for(var/entry in access_override_log)
		if(islist(entry))
			access_override_log_entries += list(entry)
	data["access_override_log"] = access_override_log_entries

	var/list/emergency_mode_log_entries = list()
	for(var/entry in emergency_mode_log)
		if(islist(entry))
			emergency_mode_log_entries += list(entry)
	data["emergency_mode_log"] = emergency_mode_log_entries

	data["access_override"] = access_override
	data["override_physician"] = override_physician
	data["override_reason"] = override_reason
	data["overridden_categories"] = overridden_categories
	data["emergency_mode"] = emergency_mode
	data["patient_name"] = patient_name

	data["can_override"] = FALSE
	if(logged_in && scan && user_access >= CLINIC_ACCESS_MEDICAL)
		data["can_override"] = TRUE

	data["override_needed"] = FALSE
	if(logged_in && scan && selected_category && !CLINIC_has_category_access(scan.assignment, selected_category) && user_access >= CLINIC_ACCESS_MEDICAL)
		data["override_needed"] = TRUE

	return data

// Calculate cost to restock based on item's base cost
/obj/clinic_machine/pyxis/proc/calculate_restock_cost(category, id, current_stock, restock_amount = 5)
	if(!category || !machine_stock[category] || id < 1 || id > length(machine_stock[category]))
		return 0

	var/list/item_data = machine_stock[category][id]
	var/base_cost = item_data["cost"]

	// Calculate how many items we're actually restocking
	// Cap at max stock of 15
	var/actual_restock = min(restock_amount, 15 - current_stock)
	if(actual_restock <= 0)
		return 0

	// Apply a small discount for bulk restocking
	var/discount_factor = 1.0
	if(actual_restock >= 5)
		discount_factor = 0.9  // 10% discount for 5+ items

	return round(base_cost * actual_restock * discount_factor)

/**
 * Check if there are controlled substances in the cart
 */
/obj/clinic_machine/pyxis/proc/has_controlled_in_cart()
	for(var/item in cart)
		if(item["category"] == "Controlled Substances")
			return TRUE
	return FALSE


/obj/clinic_machine/pyxis/proc/add_login_log(name, job)
	transaction_log += list(list(
		"timestamp" = station_time_timestamp(),
		"type" = "login",
		"user" = name,
		"user_job" = job
	))

/obj/clinic_machine/pyxis/proc/add_override_log(user_name, user_job, physician, reason, category)
	access_override_log += list(list(
		"timestamp" = station_time_timestamp(),
		"user" = user_name,
		"user_job" = user_job,
		"physician" = physician,
		"reason" = reason,
		"category" = category
	))

	transaction_log += list(list(
		"timestamp" = station_time_timestamp(),
		"type" = "override",
		"user" = user_name,
		"user_job" = user_job,
		"physician" = physician,
		"reason" = reason,
		"category" = category
	))

/obj/clinic_machine/pyxis/proc/add_emergency_log(user_name, user_job, enabled)
	emergency_mode_log += list(list(
		"timestamp" = station_time_timestamp(),
		"user" = user_name,
		"user_job" = user_job,
		"action" = enabled ? "enabled" : "disabled"
	))

	transaction_log += list(list(
		"timestamp" = station_time_timestamp(),
		"type" = "emergency_mode",
		"user" = user_name,
		"user_job" = user_job,
		"action" = enabled ? "enabled" : "disabled"
	))

// UI Actions handler
/obj/clinic_machine/pyxis/ui_act(action, params, datum/tgui/ui)
	. = ..()
	if(.)
		return

	// Reset session timeout
	if(logged_in)
		session_started = world.time

	switch(action)
		if("logout")
			logout_user()
			return TRUE

		if("select_category")
			selected_category = params["category"]
			return TRUE

		if("add_to_cart")
			if(!logged_in)
				return FALSE

			var/category = selected_category
			var/id = text2num(params["id"])

			// Check if user has access to this category
			var/has_access = CLINIC_has_category_access(scan?.assignment, category) || emergency_mode || (access_override && (category in overridden_categories))
			if(!has_access)
				ui_messages += list("System Alert: Access denied to [category]. User not authorized for dispensing.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE

			if(!category || !machine_stock[category] || id < 1 || id > length(machine_stock[category]))
				return FALSE

			var/list/item = machine_stock[category][id]

			// Check if we have stock
			if(item["stock"] < 1)
				ui_messages += list("System Alert: [item["name"]] is out of stock. Please request restock from inventory manager.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE

			// Add to cart
			var/found = FALSE
			for(var/cart_item in cart)
				if(cart_item["name"] == item["name"] && cart_item["category"] == category)
					cart_item["amount"]++
					found = TRUE
					break

			if(!found)
				cart += list(list(
					"name" = item["name"],
					"path" = item["path"],
					"category" = category,
					"amount" = 1
				))

			playsound(src, 'sound/machines/click.ogg', 20, TRUE)
			return TRUE

		if("remove_from_cart")
			var/id = text2num(params["id"])

			if(id < 1 || id > length(cart))
				return FALSE

			var/list/item = cart[id]

			if(item["amount"] > 1)
				item["amount"]--
			else
				cart.Cut(id, id + 1)

			playsound(src, 'sound/machines/click.ogg', 20, TRUE)
			return TRUE

		if("clear_cart")
			cart.Cut()
			playsound(src, 'sound/machines/terminal_prompt_confirm.ogg', 20, TRUE)
			return TRUE

		if("select_reason")
			selected_reason = params["reason"]
			return TRUE

		if("set_notes")
			dispensing_notes = params["notes"]
			return TRUE

		if("dispense")
			if(!logged_in || !scan || !current_user) {
				ui_messages += list("System Alert: User authentication required for dispensing.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE
			}

			// Check if cart is empty
			if(!length(cart)) {
				ui_messages += list("System Alert: Cart is empty. Please add items before dispensing.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE
			}

			// Check if we need a reason (for controlled substances)
			if(has_controlled_in_cart() && !selected_reason) {
				ui_messages += list("System Alert: Dispensing of controlled substances requires a reason and patient selection.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE
			}

			// Check if patient name is required
			if(has_controlled_in_cart() && (!patient_name || patient_name == "")) {
				ui_messages += list("System Alert: Patient name is required when dispensing controlled substances.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE
			}

			if(dispense_items())
				playsound(src, PYXIS_SOUND_DISPENSE, 40, TRUE)
				return TRUE
			return FALSE

		if("restock")
			if(!logged_in)
				return FALSE

			var/category = params["category"]
			var/id = text2num(params["id"])

			if(!category || !machine_stock[category] || id < 1 || id > length(machine_stock[category]))
				return FALSE

			var/list/item_data = machine_stock[category][id]
			var/current_stock = item_data["stock"]
			var/cost = calculate_restock_cost(category, id, current_stock)

			if(stored_money < cost)
				ui_messages += list("System Alert: Insufficient funds to restock [item_data["name"]].")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE

			var/old_stock = current_stock
			var/restock_amount = min(5, 15 - current_stock)
			if(restock_amount <= 0)
				ui_messages += list("System Alert: [item_data["name"]] already at maximum stock level.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return FALSE

			item_data["stock"] += restock_amount

			stored_money -= cost

			transaction_log += list(list(
				"timestamp" = station_time_timestamp(),
				"type" = "restock",
				"user" = (scan?.registered_name || "Unknown"),
				"user_job" = (scan?.assignment || "Unknown"),
				"item" = item_data["name"],
				"category" = category,
				"old_stock" = old_stock,
				"new_stock" = item_data["stock"],
				"amount" = restock_amount,
				"cost" = cost,
				"base_cost" = item_data["cost"]
			))

			ui_messages += list("Restocked [restock_amount] [item_data["name"]] for [cost] dollars. Inventory updated.")
			playsound(src, PYXIS_SOUND_RESTOCK, 30, TRUE)
			return TRUE

		if("toggle_emergency")
			if(!logged_in || user_access < CLINIC_ACCESS_FULL)
				return FALSE

			emergency_mode = !emergency_mode

			if(emergency_mode)
				playsound(src, PYXIS_SOUND_WARNING, 50, TRUE)
			else
				playsound(src, 'sound/machines/terminal_off.ogg', 50, TRUE)

			add_emergency_log(
				scan?.registered_name || "Unknown",
				scan?.assignment || "Unknown",
				emergency_mode
			)

			return TRUE

		if("scan_id")
			var/mob/user = usr
			if(!user)
				ui_messages += list("System Error: No user detected.")
				return TRUE

			var/obj/item/card/id/id_card = null

			if(istype(user.get_active_held_item(), /obj/item/card/id))
				id_card = user.get_active_held_item()

			if(!id_card && ishuman(user))
				var/mob/living/carbon/human/H = user
				id_card = H.wear_id?.GetID()

			if(id_card)
				var/job = id_card.assignment
				if(!job || !GLOB.CLINIC_job_access[job])
					ui_messages += list("Access Denied: User authentication failed. Authorized clinical staff only.")
					playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
					return TRUE

				user_access = GLOB.CLINIC_job_access[job] || CLINIC_ACCESS_BASIC
				logged_in = TRUE
				session_started = world.time
				scan = id_card
				current_user = user

				add_login_log(id_card.registered_name, job)

				ui_messages += list("Authentication successful. Welcome, [id_card.registered_name]. Pyxis MedStation ready for use.")
				playsound(src, PYXIS_SOUND_LOGIN, 30, TRUE)
				return TRUE
			else
				ui_messages += list("Access Denied: No ID card detected. Please present a valid ID card.")
				playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
				return TRUE

		if("set_access_override")
			if(!logged_in || user_access < CLINIC_ACCESS_MEDICAL)
				return FALSE

			access_override = params["override"] ? TRUE : FALSE
			override_physician = params["physician"]
			override_reason = params["reason"]

			if(access_override)
				if(!override_physician || override_physician == "")
					ui_messages += list("System Alert: Authorizing physician name is required for access override.")
					playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
					access_override = FALSE
					return TRUE

				if(!override_reason || override_reason == "")
					ui_messages += list("System Alert: Reason is required for access override.")
					playsound(src, PYXIS_SOUND_ERROR, 30, TRUE)
					access_override = FALSE
					return TRUE

				if(selected_category && !(selected_category in overridden_categories))
					overridden_categories += selected_category

					add_override_log(
						scan?.registered_name || "Unknown",
						scan?.assignment || "Unknown",
						override_physician,
						override_reason,
						selected_category
					)

					ui_messages += list("Access override activated for [selected_category]. Authorized by: [override_physician].")
					playsound(src, 'sound/machines/terminal_prompt_confirm.ogg', 30, TRUE)
			else
				overridden_categories.Cut()
				override_physician = ""
				override_reason = ""
				ui_messages += list("Access override deactivated.")
				playsound(src, 'sound/machines/terminal_prompt_deny.ogg', 30, TRUE)

			return TRUE

		if("add_override_category")
			if(!logged_in || user_access < CLINIC_ACCESS_MEDICAL || !access_override)
				return FALSE

			var/category = params["category"]
			if(!category || !machine_stock[category])
				return FALSE

			if(!(category in overridden_categories))
				overridden_categories += category

				add_override_log(
					scan?.registered_name || "Unknown",
					scan?.assignment || "Unknown",
					override_physician,
					override_reason,
					category
				)

				ui_messages += list("Access override activated for [category]. Authorized by: [override_physician].")
				playsound(src, 'sound/machines/terminal_prompt_confirm.ogg', 30, TRUE)
			return TRUE

		if("set_patient_name")
			patient_name = params["name"]
			return TRUE

		if("acknowledge_messages")
			ui_messages.Cut()
			return TRUE

/obj/clinic_machine/pyxis/proc/dispense_items()
	if(!logged_in || !scan || !current_user || !length(cart))
		return FALSE

	var/list/dispensed_items = list()
	for(var/i = 1, i <= length(cart), i++)
		var/list/cart_item = cart[i]
		var/item_name = cart_item["name"]
		var/item_path = cart_item["path"]
		var/item_category = cart_item["category"]
		var/amount = cart_item["amount"]

		// Find the item in the stock list and reduce stock
		for(var/j = 1, j <= length(machine_stock[item_category]), j++)
			var/list/stock_item = machine_stock[item_category][j]
			if(stock_item["name"] == item_name)
				if(stock_item["stock"] < amount)
					amount = stock_item["stock"]
				if(amount <= 0)
					continue
				stock_item["stock"] -= amount
				dispensed_items += list(list(
					"name" = item_name,
					"amount" = amount,
					"category" = item_category
				))
				for(var/k = 0, k < amount, k++)
					new item_path(get_step(src, src.dir))
				break

	transaction_log += list(list(
		"timestamp" = station_time_timestamp(),
		"type" = "dispense",
		"user" = (scan?.registered_name || "Unknown"),
		"user_job" = (scan?.assignment || "Unknown"),
		"items" = dispensed_items,
		"patient" = patient_name,
		"reason" = selected_reason,
		"notes" = dispensing_notes,
		"override" = access_override ? list(
			"physician" = override_physician,
			"reason" = override_reason
		) : null
	))

	cart.Cut()
	selected_reason = null
	dispensing_notes = ""
	patient_name = ""
	ui_messages += list("Dispensation complete. Please remove items from MedStation tray.")
	return TRUE
