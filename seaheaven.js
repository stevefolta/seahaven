var felt = null;
var card_images = null;
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
		card_y += card_z * card_images.pile_y_offset;
	this.cards.push(card);
	card.move_to(this.base_x, card_y, card_z);
	}


// CardImages.

function CardImages(name, pile_x_offset, pile_y_offset) {
	this.name = name;
	this.pile_x_offset = pile_x_offset;
	this.pile_y_offset = pile_y_offset;
	}

CardImages.prototype.image_url_for = function(suit, rank) {
	return "cards/" + this.name + "/" + this.filename_for(suit, rank);
	}

bellot_fuchs_hart = new CardImages("bellot-fuchs-hart", 180, 60);
bellot_fuchs_hart.rank_names = [ "a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k" ];
bellot_fuchs_hart.filename_for = function(suit, rank) {
	return suit_names[suit] + "-" + this.rank_names[rank] + "-150.png";
	}


// Gameplay.

function seaheaven_start() {
	felt = document.getElementById("felt");
	card_images = bellot_fuchs_hart;

	// card_1 = new Card(0, 1);
	// card_2 = new Card(0, 0);
	// card_2.move_to(0, 60);

	// Make the piles.
	var num_columns = 10;
	var columns = [];
	var base_x = 0;
	var i;
	for (i = 0; i < num_columns; ++i) {
		columns[i] = new Pile(base_x, 0, true);
		base_x += card_images.pile_x_offset;
		}

	// Populate the piles.
	var suit, rank;
	var which_column = 0;
	for (suit = 0; suit < 4; ++suit) {
		for (rank = 0; rank < 13; ++ rank) {
			var card = new Card(suit, rank);
			columns[which_column].add_card(card);
			which_column += 1;
			if (which_column >= num_columns)
				which_column = 0;
			}
		}
	}

