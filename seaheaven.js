var felt = null;
var card_images = null;
var num_columns = 10;
var foundations = [];
var cells = [];
var columns = [];

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
	this.img = document.createElement("img");
	this.img.setAttribute("src", card_images.image_url_for(suit, rank));
	this.img.style.position = "absolute";
	felt.appendChild(this.img);
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

Pile.prototype.pop_card = function() {
	return this.cards.pop();
	}

Pile.prototype.is_empty = function() {
	return this.cards.lenght == 0;
	}

Pile.prototype.top_card = function() {
	var num_cards = this.cards.length;
	if (num_cards == 0)
		return null;
	return this.cards[num_cards - 1];
	}


// CardImages.

function CardImages(name, pile_x_offset, columns_y, card_y_offset) {
	this.name = name;
	this.pile_x_offset = pile_x_offset;
	this.columns_y = columns_y;
	this.card_y_offset = card_y_offset;
	}

CardImages.prototype.image_url_for = function(suit, rank) {
	return "cards/" + this.name + "/" + this.filename_for(suit, rank);
	}

bellot_fuchs_hart = new CardImages("bellot-fuchs-hart", 180, 260, 60);
bellot_fuchs_hart.rank_names = [ "a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k" ];
bellot_fuchs_hart.filename_for = function(suit, rank) {
	return suit_names[suit] + "-" + this.rank_names[rank] + "-150.png";
	}


// Gameplay.

function deal() {
	// Clear current game.
	var i;
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
		foundation.add_flying_card(card);

	return can_build;
	}


function seaheaven_start() {
	felt = document.getElementById("felt");
	card_images = bellot_fuchs_hart;

	deal();

	// Auto-build.
	// Wait a moment to finish loading the page before doing this.
	setTimeout(
		function() { auto_build(); },
		200);
	}

