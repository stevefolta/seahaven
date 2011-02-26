var felt = null;
var card_images = null;
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


// Card.

function Card(suit, rank) {
	this.suit = suit;
	this.rank = rank;
	this.img = document.createElement("img");
	this.img.setAttribute("src", card_images.image_url_for(suit, rank));
	this.img.style.position = "absolute";
	felt.appendChild(this.img);
	}

Card.prototype.move_to = function(x, y, z) {
	this.img.style.left = x + "px";
	this.img.style.top = y + "px";
	if (z)
		this.img.style.zIndex = "" + z;
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
	card.move_to(this.base_x, card_y, card_z);
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
	var num_columns = 10;
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


function seaheaven_start() {
	felt = document.getElementById("felt");
	card_images = bellot_fuchs_hart;

	deal();
	}

