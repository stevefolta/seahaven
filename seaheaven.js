var felt = null;
var card_images = null;
var num_columns = 10;
var foundations = [];
var cells = [];
var columns = [];
var king = 12; 	// == 13 - 1

var logging_enabled = false;

var suit_names = [ "clubs", "diamonds", "hearts", "spades" ];


// Logging.

function log(message) {
	if (!logging_enabled)
		return;

	console.log(message);
	}


// Utils.

function str_to_pixels(str) {
	return parseInt(str.substr(0, str.length - 2));
	}


// Card.

function Card(suit, rank) {
	this.suit = suit;
	this.rank = rank;
	this.pile = null;
	var img = document.createElement("img");
	this.img = img;
	img.setAttribute("src", card_images.image_url_for(suit, rank));
	img.style.position = "absolute";
	img.card = this;
	img.onclick = function() { img.card.clicked(); };
	felt.appendChild(this.img);
	}

Card.prototype.goes_on = function(other_card) {
	return (this.suit == other_card.suit && this.rank == other_card.rank - 1);
	}

Card.prototype.move_to = function(x, y, z) {
	this.img.style.left = x + "px";
	this.img.style.top = y + "px";
	if (arguments.length >= 3)
		this.img.style.zIndex = "" + z;
	}

Card.prototype.fly_to = function(x, y, z) {
	this.img.style.zIndex = "100";
	this.flight_dest = { x: x, y: y, z: z };
	this.flight_frame();
	}

Card.prototype.flight_frame = function() {
	var close_enough = 3;
	var frame_ms = 10;
	var zeno_denominator = 4;

	if (!this.flight_dest)
		return;

	// If we're close enough, finish.
	var cur_x = str_to_pixels(this.img.style.left);
	var cur_y = str_to_pixels(this.img.style.top);
	var x_distance = Math.abs(this.flight_dest.x - cur_x);
	var y_distance = Math.abs(this.flight_dest.y - cur_y);
	if (x_distance < close_enough && y_distance < close_enough) {
		this.move_to(this.flight_dest.x, this.flight_dest.y, this.flight_dest.z);
		this.flight_dest = null;
		return;
		}

	// Zeno flight.
	this.move_to(
		Math.round(cur_x + (this.flight_dest.x - cur_x) / zeno_denominator),
		Math.round(cur_y + (this.flight_dest.y - cur_y) / zeno_denominator));
	var card = this;
	setTimeout(function() { card.flight_frame(); }, frame_ms);
	}

Card.prototype.clicked = function() {
	if (this != this.pile.top_card()) {
		attempt_run_move(this);
		return;
		}

	var target_pile = find_obvious_target_for(this);
	if (target_pile) {
		start_action();
		move_card_to(this, target_pile);
		auto_build();
		end_action();
		}
	}

Card.prototype.card_images_changed = function() {
	this.img.setAttribute(
		"src", card_images.image_url_for(this.suit, this.rank));
	}


// Pile.

function Pile(base_x, base_y, grows_down) {
	this.base_x = base_x;
	this.base_y = base_y;
	this.grows_down = grows_down;
	this.cards = [];
	}

Pile.prototype.add_card = function(card) {
	var card_z = this.cards.length;
	var card_y = this.base_y;
	if (this.grows_down)
		card_y += card_z * card_images.card_y_offset;
	this.cards.push(card);
	if (card.pile)
		card.pile.pop_card();
	card.pile = this;
	card.move_to(this.base_x, card_y, card_z);
	}

Pile.prototype.add_flying_card = function(card) {
	var card_z = this.cards.length;
	var card_y = this.base_y;
	if (this.grows_down)
		card_y += card_z * card_images.card_y_offset;
	this.cards.push(card);
	if (card.pile)
		card.pile.pop_card();
	card.pile = this;
	card.fly_to(this.base_x, card_y, card_z);
	}

Pile.prototype.move_to = function(x, y) {
	this.base_x = x;
	this.base_y = y;
	var i;
	var card_x = x;
	var card_y = y;
	for (i = 0; i < this.cards.length; ++i) {
		var card = this.cards[i];
		card.move_to(card_x, card_y);
		if (this.grows_down)
			card_y += card_images.card_y_offset;
		}
	}

Pile.prototype.card_images_changed = function() {
	for (var i = 0; i < this.cards.length; ++i)
		this.cards[i].card_images_changed();
	}

Pile.prototype.pop_card = function() {
	return this.cards.pop();
	}

Pile.prototype.is_empty = function() {
	return this.cards.length == 0;
	}

Pile.prototype.top_card = function() {
	var num_cards = this.cards.length;
	if (num_cards == 0)
		return null;
	return this.cards[num_cards - 1];
	}

Pile.prototype.run_depth_of = function(card) {
	var i;
	var depth = 0;
	var last_card = null;
	for (i = this.cards.length - 1; i >= 0; --i) {
		var cur_card = this.cards[i];
		// Is it really part of a run?
		if (last_card) {
			if (cur_card.suit != last_card.suit)
				return -1;
			if (cur_card.rank != last_card.rank + 1)
				return -1;
			}
		// Did we reach the card?
		if (cur_card == card)
			break;
		// Check the next card.
		depth += 1;
		last_card = cur_card;
		}
	return depth;
	}

Pile.prototype.depth_of = function(card) {
	var i;
	var depth = 0;
	for (i = this.cards.length - 1; i >= 0; --i) {
		if (this.cards[i] == card)
			return depth;
		depth += 1;
		}
	return -1;
	}

Pile.prototype.clear = function() {
	while (true) {
		var card = this.cards.pop();
		if (!card)
			break;
		felt.removeChild(card.img);
		}
	}


// History.

var sentinal_action = null;
var last_action = null;
var cur_action = null;

function Action() {
	this.moves = [];
	this.next = null;
	this.prev = null;
	}

Action.prototype.add_move = function(source_pile, dest_pile) {
	var move = { src: source_pile, dest: dest_pile };
	this.moves.push(move);
	}

Action.prototype.undo = function() {
	var i;
	for (i = this.moves.length - 1; i >= 0; --i) {
		var move = this.moves[i];
		move.src.add_flying_card(move.dest.top_card());
		}
	}

Action.prototype.redo = function() {
	var i;
	for (i = 0; i < this.moves.length; ++i) {
		var move = this.moves[i];
		move.dest.add_flying_card(move.src.top_card());
		}
	}

function init_actions() {
	sentinal_action = new Action();
	last_action = sentinal_action;
	}

function start_action() {
	cur_action = new Action();
	}

function end_action() {
	cur_action.prev = last_action;
	last_action.next = cur_action;
	last_action = cur_action;
	cur_action = null;
	}

function move_from_to(source_pile, dest_pile) {
	dest_pile.add_flying_card(source_pile.top_card());
	if (cur_action)
		cur_action.add_move(source_pile, dest_pile);
	}

function move_card_to(card, pile) {
	move_from_to(card.pile, pile);
	}

function can_undo() {
	return (last_action && last_action != sentinal_action);
	}

function undo() {
	if (!can_undo())
		return;

	last_action.undo();
	last_action = last_action.prev;
	}

function can_redo() {
	return (last_action && last_action.next);
	}

function redo() {
	if (!can_redo())
		return;

	last_action.next.redo();
	last_action = last_action.next;
	}



// CardImages.

function CardImages(properties) {
	for (var prop in properties)
		this[prop] = properties[prop];

	if (!this.pile_x_offset && this.card_width)
		this.pile_x_offset = Math.round(this.card_width * 1.2);
	if (!this.columns_y && this.card_height)
		this.columns_y = Math.round(this.card_height * 1.2);
	if (!this.card_y_offset && this.card_height)
		this.card_y_offset = Math.round(this.card_height * 0.3);
	}
CardImages.prototype.image_url_for = function(suit, rank) {
	return "cards/" + this.name + "/" + this.filename_for(suit, rank);
	}

var card_images_specs = [
	{
		name: "bellot-fuchs-hart",
		card_width: 150,
		card_height: 215,
		cards_by: "Bellot / Fuchs / Hart",
		cards_url: "http://www.eludication.org/playingcards.html",
		rank_names: [ "a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k" ],
		filename_for: function(suit, rank) {
			return suit_names[suit] + "-" + this.rank_names[rank] + "-150.png";
			}
		},
	{
		name: "bellot-fuchs-hart-small",
		card_width: 75,
		card_height: 107,
		cards_by: "Bellot / Fuchs / Hart",
		cards_url: "http://www.eludication.org/playingcards.html",
		rank_names: [ "a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k" ],
		filename_for: function(suit, rank) {
			return suit_names[suit] + "-" + this.rank_names[rank] + "-75.png";
			}
		},
/*
	{
		name: "nu-mam",
		card_width: 106,
		card_height: 169,
		suit_names: [ "c", "d", "h", "s" ],
		filename_for: function(suit, rank) {
			var filename = "" + (rank + 1).toString();
			while (filename.length < 3)
				filename = "0" + filename;
			return filename + this.suit_names[suit] + ".png";
			}
		},
	{
		name: "pysol-xskat-french-large",
		card_width: 90,
		card_height: 140,
		suit_names: [ "c", "d", "h", "s" ],
		filename_for: function(suit, rank) {
			var filename = "" + (rank + 1).toString();
			while (filename.length < 2)
				filename = "0" + filename;
			return filename + this.suit_names[suit] + ".png";
			}
		},
*/
	];

var all_card_images = null;

function init_card_images() {
	all_card_images = {};
	for (var i = 0; i < card_images_specs.length; ++i) {
		var spec = card_images_specs[i];
		all_card_images[spec.name] = new CardImages(spec);
		}

	card_images = all_card_images["bellot-fuchs-hart"];
	}

function change_card_images_to(new_name) {
	var i;

	card_images = all_card_images[new_name];

	// Foundations.
	var base_x = 0;
	for (i = 0; i < 4; ++i) {
		foundations[i].move_to(base_x, 0);
		foundations[i].card_images_changed();
		if (i == 1)
			base_x = 8 * card_images.pile_x_offset;
		else
			base_x += card_images.pile_x_offset;
		}
	// Cells.
	base_x = 3 * card_images.pile_x_offset;
	for (i = 0; i < 4; ++i) {
		cells[i].move_to(base_x, 0);
		cells[i].card_images_changed();
		base_x += card_images.pile_x_offset;
		}
	// Columns.
	base_x = 0;
	for (i = 0; i < num_columns; ++i) {
		columns[i].move_to(base_x, card_images.columns_y);
		columns[i].card_images_changed();
		base_x += card_images.pile_x_offset;
		}
	}

function switch_card_images() {
	switch (card_images.name) {
		case "bellot-fuchs-hart":
			change_card_images_to("bellot-fuchs-hart-small");
			break;
		case "bellot-fuchs-hart-small":
		default:
			change_card_images_to("bellot-fuchs-hart");
			break;
		}
	}



// Gameplay.

function deal() {
	// Clear current game.
	var i;
	init_actions();
	// Build foundations.
	foundations = [];
	var base_x = 0;
	for (i = 0; i < 4; ++i) {
		foundations[i] = new Pile(base_x, 0, false);
		if (i == 1)
			base_x = 8 * card_images.pile_x_offset;
		else
			base_x += card_images.pile_x_offset;
		}
	// Build cells.
	cells = [];
	base_x = 3 * card_images.pile_x_offset;
	for (i = 0; i < 4; ++i) {
		cells[i] = new Pile(base_x, 0, false);
		base_x += card_images.pile_x_offset;
		}
	// Build columns.
	columns = [];
	base_x = 0;
	for (i = 0; i < num_columns; ++i) {
		columns[i] = new Pile(base_x, card_images.columns_y, true);
		base_x += card_images.pile_x_offset;
		}

	// Make a deck.
	var deck = [];
	var suit, rank;
	for (suit = 0; suit < 4; ++suit) {
		for (rank = 0; rank < 13; ++ rank)
			deck.push(new Card(suit, rank));
		}

	// Shuffle it.
	var cards_left;
	for (cards_left = 51; cards_left > 0; cards_left -=1) {
		var which_card = Math.floor(Math.random() * cards_left);
		var chosen_card = deck[which_card];
		deck[which_card] = deck[cards_left];
		deck[cards_left] = chosen_card;
		}

	// Populate the columns.
	var which_column = 0;
	for (cards_left = 50; cards_left > 0; cards_left -= 1) {
		columns[which_column].add_card(deck.pop());
		which_column += 1;
		if (which_column >= num_columns)
			which_column = 0;
		}
	// Deal the last two cards to the middle cells.
	cells[1].add_card(deck.pop());
	cells[2].add_card(deck.pop());
	}


function clear_game() {
	var i;

	for (i = 0; i < 4; ++i) {
		foundations[i].clear();
		cells[i].clear();
		}
	for (i = 0; i < num_columns; ++i)
		columns[i].clear();
	}


function start_game() {
	start_action();
	auto_build();
	end_action();
	}


function auto_build() {
	var done = false;
	while (!done) {
		var i;
		done = true; 	// Until we determine otherwise.

		// Check the cells.
		for (i = 0; i < 4; ++i) {
			var card = cells[i].top_card();
			if (card && attempt_build_with(card)) {
				done = false;
				break;
				}
			}
		if (!done)
			continue;

		// Check the columns.
		for (i = 0; i < num_columns; ++i) {
			var card = columns[i].top_card();
			if (card && attempt_build_with(card)) {
				done = false;
				break;
				}
			}
		}
	}

function attempt_build_with(card) {
	var foundation = foundations[card.suit];
	var top_rank = -1;
	var top_card = foundation.top_card();
	if (top_card)
		top_rank = top_card.rank;
	var can_build = (card.rank == top_rank + 1);

	if (can_build)
		move_card_to(card, foundation);

	return can_build;
	}

function find_obvious_target_for(card) {
	var i;

	// We won't bother to check the foundations, as auto-build takes care of
	// that.

	// On a column.
	for (i = 0; i < num_columns; ++i) {
		var column = columns[i];
		var top_card = column.top_card();
		if (top_card) {
			if (card.goes_on(top_card))
				return column;
			}
		else {
			// Empty column; a king can go here.
			if (card.rank == king)
				return column;
			}
		}

	// Otherwise, look for an empty cell.
	for (i = 0; i < 4; ++i) {
		var cell = cells[i];
		if (cell.is_empty())
			return cell;
		}

	return null;
	}

function attempt_run_move(card) {
	var i;

	// We won't bother to check the foundations, as auto-build takes care of
	// that.

	// How many free cells do we have?
	var num_free_cells = 0;
	for (i = 0; i < 4; ++i) {
		if (cells[i].is_empty())
			num_free_cells += 1;
		}

	var depth = card.pile.run_depth_of(card);

	// King to empty column?
	if (depth >= 0 && card.rank == king) {
		// Look for an empty column.
		var column = null;
		for (i = 0; i < num_columns; ++i) {
			if (columns[i].is_empty()) {
				column = columns[i];
				break;
				}
			}

		// Do it if we can.
		if (column && depth <= num_free_cells) {
			move_run_to(card, column);
			return;
			}
		}

	// Onto another column?
	if (depth >= 0) {
		var column = null;
		for (i = 0; i < num_columns; ++i) {
			var column_top = columns[i].top_card();
			if (!column_top)
				continue;
			if (card.goes_on(column_top)) {
				column = columns[i];
				break;
				}
			}
		if (column && depth <= num_free_cells) {
			move_run_to(card, column);
			return;
			}
		}

	// Onto the free cells?
	if (card.pile.depth_of(card) < num_free_cells) {
		start_action();

		src_pile = card.pile;
		while (true) {
			var top_card = src_pile.top_card();
			if (!top_card) {
				// Shouldn't happen.
				break;
				}
			move_card_to(top_card, empty_free_cell());
			if (top_card == card)
				break;
			}

		auto_build();
		end_action();
		return;
		}
	}

function move_run_to(card, dest_pile) {
	start_action();

	// Move the rest of the cards in the run toward the free cells.
	var src_pile = card.pile;
	var dest_free_cells = [];
	while (src_pile.top_card() != card) {
		var free_cell = empty_free_cell();
		move_from_to(src_pile, free_cell);
		dest_free_cells.push(free_cell);
		}

	// Move the card itself.
	move_card_to(card, dest_pile);

	// Move the other cards back down off the free cells.
	while (true) {
		var free_cell = dest_free_cells.pop();
		if (!free_cell)
			break;
		move_from_to(free_cell, dest_pile);
		}

	auto_build();
	end_action();
	}

function empty_free_cell() {
	var i;
	for (i = 0; i < 4; ++i) {
		if (cells[i].is_empty())
			return cells[i];
		}
	return null;
	}


function handle_key(event) {
	if (!event)
		event = window.event;

	var handled = false;

	if (event.ctrlKey || event.altKey || event.metaKey)
		return;

	var key = event.keyCode;
	if (key == 0)
		key = event.which;

	switch (key) {
		case 27:
			key = "esc";
			break;
		case 37:
			key = "left-arrow";
			break;
		case 38:
			key = "up-arrow";
			break;
		case 39:
			key = "right-arrow";
			break;
		case 40:
			key = "down-arrow";
			break;
		default:
			key = String.fromCharCode(key);
			break;
		}

	handled = handle_play_key(key);

	if (handled) {
		event.preventDefault();
		event.stopPropagation();
		}
	}

function handle_play_key(key) {
	log("Got key: " + key);
	var handled = true;

	switch (key) {
		case "esc":
		case "u":
			undo();
			break;
		case "r":
			redo();
			break;
		case "n":
			new_game();
			break;
		case "c":
			switch_card_images();
			break;
		default:
			handled = false;
			break;
		}

	return handled;
	}


function new_game() {
	clear_game();
	deal();
	start_game();
	}


function seaheaven_start() {
	felt = document.getElementById("felt");
	document.onkeypress = handle_key;
	init_card_images();

	deal();

	// Auto-build.
	// Wait a moment to finish loading the page before doing this.
	setTimeout(start_game, 10);
	}

