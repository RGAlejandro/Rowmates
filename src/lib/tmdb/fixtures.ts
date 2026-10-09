// Offline catalogue used when TMDB_MOCK=1 or no TMDB token is configured.
// Ids match real TMDB ids so data stays valid when switching to the live API.
// Overviews are original one-liners; provider availability is invented for the mock.

export interface FixtureFilm {
  id: number;
  title: string;
  year: number;
  runtime: number;
  genres: number[];
  directors: string[];
  cast: string[];
  lang: string;
  vote: number;
  popularity: number;
  imdb: string;
  overview: string;
}

export const FIXTURE_FILMS: FixtureFilm[] = [
  { id: 278, title: "The Shawshank Redemption", year: 1994, runtime: 142, genres: [18, 80], directors: ["Frank Darabont"], cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"], lang: "en", vote: 8.7, popularity: 105, imdb: "tt0111161", overview: "A banker serving a life sentence finds quiet ways to stay free inside the walls of a brutal prison." },
  { id: 238, title: "The Godfather", year: 1972, runtime: 175, genres: [18, 80], directors: ["Francis Ford Coppola"], cast: ["Marlon Brando", "Al Pacino", "James Caan"], lang: "en", vote: 8.7, popularity: 96, imdb: "tt0068646", overview: "The aging head of a crime family hands his empire to the son who wanted no part of it." },
  { id: 155, title: "The Dark Knight", year: 2008, runtime: 152, genres: [28, 80, 18, 53], directors: ["Christopher Nolan"], cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"], lang: "en", vote: 8.5, popularity: 120, imdb: "tt0468569", overview: "Batman faces a criminal mastermind who wants to prove that anyone can be pushed into chaos." },
  { id: 680, title: "Pulp Fiction", year: 1994, runtime: 154, genres: [53, 80], directors: ["Quentin Tarantino"], cast: ["John Travolta", "Samuel L. Jackson", "Uma Thurman"], lang: "en", vote: 8.5, popularity: 98, imdb: "tt0110912", overview: "Hitmen, a boxer and a gangster's wife collide in a looping tale of Los Angeles crime." },
  { id: 550, title: "Fight Club", year: 1999, runtime: 139, genres: [18, 53], directors: ["David Fincher"], cast: ["Brad Pitt", "Edward Norton", "Helena Bonham Carter"], lang: "en", vote: 8.4, popularity: 100, imdb: "tt0137523", overview: "An insomniac office worker and a reckless soap salesman start an underground club that spirals out of control." },
  { id: 13, title: "Forrest Gump", year: 1994, runtime: 142, genres: [35, 18, 10749], directors: ["Robert Zemeckis"], cast: ["Tom Hanks", "Robin Wright", "Gary Sinise"], lang: "en", vote: 8.5, popularity: 90, imdb: "tt0109830", overview: "A kind-hearted man drifts through decades of American history without losing sight of his first love." },
  { id: 27205, title: "Inception", year: 2010, runtime: 148, genres: [28, 878, 12], directors: ["Christopher Nolan"], cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"], lang: "en", vote: 8.4, popularity: 125, imdb: "tt1375666", overview: "A thief who steals secrets from dreams is hired to plant an idea instead." },
  { id: 603, title: "The Matrix", year: 1999, runtime: 136, genres: [28, 878], directors: ["Lana Wachowski", "Lilly Wachowski"], cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"], lang: "en", vote: 8.2, popularity: 92, imdb: "tt0133093", overview: "A hacker learns that his reality is a simulation and joins the rebels fighting the machines behind it." },
  { id: 157336, title: "Interstellar", year: 2014, runtime: 169, genres: [12, 18, 878], directors: ["Christopher Nolan"], cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"], lang: "en", vote: 8.4, popularity: 130, imdb: "tt0816692", overview: "Explorers travel through a wormhole in search of a new home as Earth slowly dies." },
  { id: 496243, title: "Parasite", year: 2019, runtime: 133, genres: [35, 53, 18], directors: ["Bong Joon Ho"], cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"], lang: "ko", vote: 8.5, popularity: 99, imdb: "tt6751668", overview: "A struggling family schemes its way into the household of a wealthy one, until a secret surfaces." },
  { id: 129, title: "Spirited Away", year: 2001, runtime: 125, genres: [16, 10751, 14], directors: ["Hayao Miyazaki"], cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"], lang: "ja", vote: 8.5, popularity: 88, imdb: "tt0245429", overview: "A girl trapped in a world of spirits works at a bathhouse to free her parents." },
  { id: 244786, title: "Whiplash", year: 2014, runtime: 107, genres: [18, 10402], directors: ["Damien Chazelle"], cast: ["Miles Teller", "J.K. Simmons", "Paul Reiser"], lang: "en", vote: 8.4, popularity: 85, imdb: "tt2582802", overview: "A young drummer and a ruthless instructor push each other toward greatness and breaking point." },
  { id: 313369, title: "La La Land", year: 2016, runtime: 129, genres: [35, 18, 10749, 10402], directors: ["Damien Chazelle"], cast: ["Ryan Gosling", "Emma Stone", "John Legend"], lang: "en", vote: 7.9, popularity: 88, imdb: "tt3783958", overview: "A jazz pianist and an aspiring actress fall in love while chasing their dreams in Los Angeles." },
  { id: 419430, title: "Get Out", year: 2017, runtime: 104, genres: [9648, 53, 27], directors: ["Jordan Peele"], cast: ["Daniel Kaluuya", "Allison Williams", "Catherine Keener"], lang: "en", vote: 7.6, popularity: 80, imdb: "tt5052448", overview: "A weekend visit to his girlfriend's parents turns into a nightmare for a young photographer." },
  { id: 76341, title: "Mad Max: Fury Road", year: 2015, runtime: 121, genres: [28, 12, 878], directors: ["George Miller"], cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"], lang: "en", vote: 7.6, popularity: 82, imdb: "tt1392190", overview: "In a desert wasteland, a drifter and a rebel warrior flee a tyrant across the sand." },
  { id: 545611, title: "Everything Everywhere All at Once", year: 2022, runtime: 140, genres: [28, 12, 878, 35], directors: ["Daniel Kwan", "Daniel Scheinert"], cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu"], lang: "en", vote: 7.8, popularity: 95, imdb: "tt6710474", overview: "A laundromat owner must connect with versions of herself across the multiverse to save everything." },
  { id: 872585, title: "Oppenheimer", year: 2023, runtime: 181, genres: [18, 36], directors: ["Christopher Nolan"], cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"], lang: "en", vote: 8.1, popularity: 160, imdb: "tt15398776", overview: "The physicist who led the race to build the atomic bomb, and the cost that followed." },
  { id: 346698, title: "Barbie", year: 2023, runtime: 114, genres: [35, 12], directors: ["Greta Gerwig"], cast: ["Margot Robbie", "Ryan Gosling", "America Ferrera"], lang: "en", vote: 7.0, popularity: 150, imdb: "tt1517268", overview: "Barbie leaves her perfect plastic world and discovers what it means to be human." },
  { id: 438631, title: "Dune", year: 2021, runtime: 155, genres: [878, 12], directors: ["Denis Villeneuve"], cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac"], lang: "en", vote: 7.8, popularity: 115, imdb: "tt1160419", overview: "A young noble's family takes control of a desert planet that holds the universe's most valuable resource." },
  { id: 693134, title: "Dune: Part Two", year: 2024, runtime: 167, genres: [878, 12], directors: ["Denis Villeneuve"], cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"], lang: "en", vote: 8.1, popularity: 210, imdb: "tt15239678", overview: "Paul joins the Fremen and wages war on the conspirators who destroyed his family." },
  { id: 120467, title: "The Grand Budapest Hotel", year: 2014, runtime: 100, genres: [35, 18], directors: ["Wes Anderson"], cast: ["Ralph Fiennes", "Tony Revolori", "F. Murray Abraham"], lang: "en", vote: 8.0, popularity: 78, imdb: "tt2278388", overview: "A legendary concierge and his lobby boy are swept up in the theft of a priceless painting." },
  { id: 194, title: "Amélie", year: 2001, runtime: 122, genres: [35, 10749], directors: ["Jean-Pierre Jeunet"], cast: ["Audrey Tautou", "Mathieu Kassovitz", "Rufus"], lang: "fr", vote: 7.9, popularity: 66, imdb: "tt0211915", overview: "A shy Parisian waitress decides to secretly improve the lives of the people around her." },
  { id: 1417, title: "Pan's Labyrinth", year: 2006, runtime: 118, genres: [14, 18, 10752], directors: ["Guillermo del Toro"], cast: ["Ivana Baquero", "Sergi López", "Maribel Verdú"], lang: "es", vote: 7.8, popularity: 71, imdb: "tt0457430", overview: "In postwar Spain, a girl escapes into a dark fairy-tale world beneath her stepfather's cruelty." },
  { id: 152601, title: "Her", year: 2013, runtime: 126, genres: [10749, 878, 18], directors: ["Spike Jonze"], cast: ["Joaquin Phoenix", "Scarlett Johansson", "Amy Adams"], lang: "en", vote: 7.8, popularity: 70, imdb: "tt1798709", overview: "A lonely writer falls in love with an intelligent operating system." },
  { id: 376867, title: "Moonlight", year: 2016, runtime: 111, genres: [18], directors: ["Barry Jenkins"], cast: ["Trevante Rhodes", "Mahershala Ali", "Naomie Harris"], lang: "en", vote: 7.4, popularity: 63, imdb: "tt4975722", overview: "Three chapters in the life of a young man growing up in Miami as he discovers who he is." },
  { id: 391713, title: "Lady Bird", year: 2017, runtime: 94, genres: [35, 18], directors: ["Greta Gerwig"], cast: ["Saoirse Ronan", "Laurie Metcalf", "Timothée Chalamet"], lang: "en", vote: 7.3, popularity: 64, imdb: "tt4925292", overview: "A headstrong teenager navigates her last year of high school and a fierce bond with her mother." },
  { id: 37799, title: "The Social Network", year: 2010, runtime: 121, genres: [18], directors: ["David Fincher"], cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake"], lang: "en", vote: 7.4, popularity: 72, imdb: "tt1285016", overview: "The founding of Facebook and the friendships and lawsuits left in its wake." },
  { id: 329865, title: "Arrival", year: 2016, runtime: 116, genres: [18, 878, 9648], directors: ["Denis Villeneuve"], cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker"], lang: "en", vote: 7.6, popularity: 74, imdb: "tt2543164", overview: "A linguist races to understand mysterious visitors before tensions turn into global war." },
  { id: 335984, title: "Blade Runner 2049", year: 2017, runtime: 164, genres: [878, 18], directors: ["Denis Villeneuve"], cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"], lang: "en", vote: 7.6, popularity: 80, imdb: "tt1856101", overview: "A replicant blade runner uncovers a secret that could plunge society into chaos." },
  { id: 324857, title: "Spider-Man: Into the Spider-Verse", year: 2018, runtime: 117, genres: [16, 28, 12, 878], directors: ["Bob Persichetti", "Peter Ramsey", "Rodney Rothman"], cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld"], lang: "en", vote: 8.4, popularity: 95, imdb: "tt4633694", overview: "Teenager Miles Morales becomes Spider-Man and meets heroes from other dimensions." },
  { id: 354912, title: "Coco", year: 2017, runtime: 105, genres: [10751, 16, 10402, 12], directors: ["Lee Unkrich"], cast: ["Anthony Gonzalez", "Gael García Bernal", "Benjamin Bratt"], lang: "en", vote: 8.2, popularity: 85, imdb: "tt2380307", overview: "A boy who dreams of music journeys to the Land of the Dead to uncover his family's history." },
  { id: 14160, title: "Up", year: 2009, runtime: 96, genres: [16, 35, 10751, 12], directors: ["Pete Docter"], cast: ["Ed Asner", "Christopher Plummer", "Jordan Nagai"], lang: "en", vote: 7.9, popularity: 84, imdb: "tt1049413", overview: "A widower ties thousands of balloons to his house and flies off with an unexpected stowaway." },
  { id: 10681, title: "WALL·E", year: 2008, runtime: 98, genres: [16, 10751, 878], directors: ["Andrew Stanton"], cast: ["Ben Burtt", "Elissa Knight", "Jeff Garlin"], lang: "en", vote: 8.1, popularity: 76, imdb: "tt0910970", overview: "A lonely trash-compacting robot follows his heart into space." },
  { id: 76, title: "Before Sunrise", year: 1995, runtime: 101, genres: [18, 10749], directors: ["Richard Linklater"], cast: ["Ethan Hawke", "Julie Delpy", "Andrea Eckert"], lang: "en", vote: 7.8, popularity: 55, imdb: "tt0112471", overview: "Two strangers meet on a train and spend one night walking through Vienna." },
  { id: 843, title: "In the Mood for Love", year: 2000, runtime: 98, genres: [18, 10749], directors: ["Wong Kar-wai"], cast: ["Tony Leung Chiu-wai", "Maggie Cheung", "Rebecca Pan"], lang: "cn", vote: 8.1, popularity: 54, imdb: "tt0118694", overview: "Two neighbors in 1960s Hong Kong grow close after suspecting their spouses of an affair." },
  { id: 531428, title: "Portrait of a Lady on Fire", year: 2019, runtime: 122, genres: [18, 10749, 36], directors: ["Céline Sciamma"], cast: ["Noémie Merlant", "Adèle Haenel", "Luàna Bajrami"], lang: "fr", vote: 8.1, popularity: 60, imdb: "tt8613070", overview: "A painter is commissioned to secretly paint a reluctant bride-to-be on an isolated island." },
  { id: 666277, title: "Past Lives", year: 2023, runtime: 106, genres: [18, 10749], directors: ["Celine Song"], cast: ["Greta Lee", "Teo Yoo", "John Magaro"], lang: "en", vote: 7.7, popularity: 90, imdb: "tt13238346", overview: "Two childhood friends reunite decades later and wonder about the lives they could have had." },
  { id: 965150, title: "Aftersun", year: 2022, runtime: 102, genres: [18], directors: ["Charlotte Wells"], cast: ["Paul Mescal", "Frankie Corio", "Celia Rowlson-Hall"], lang: "en", vote: 7.7, popularity: 68, imdb: "tt19770238", overview: "A woman revisits the memories of a holiday she took with her father twenty years earlier." },
  { id: 694, title: "The Shining", year: 1980, runtime: 144, genres: [27, 53], directors: ["Stanley Kubrick"], cast: ["Jack Nicholson", "Shelley Duvall", "Danny Lloyd"], lang: "en", vote: 8.2, popularity: 82, imdb: "tt0081505", overview: "A writer takes his family to an isolated hotel for the winter, where something sinister awaits." },
  { id: 348, title: "Alien", year: 1979, runtime: 117, genres: [27, 878], directors: ["Ridley Scott"], cast: ["Sigourney Weaver", "Tom Skerritt", "Veronica Cartwright"], lang: "en", vote: 8.1, popularity: 75, imdb: "tt0078748", overview: "The crew of a commercial spaceship meets a deadly lifeform after answering a distress call." },
  { id: 578, title: "Jaws", year: 1975, runtime: 124, genres: [27, 53, 12], directors: ["Steven Spielberg"], cast: ["Roy Scheider", "Robert Shaw", "Richard Dreyfuss"], lang: "en", vote: 7.7, popularity: 68, imdb: "tt0073195", overview: "A police chief, a scientist and a fisherman hunt a great white shark terrorizing a beach town." },
  { id: 38, title: "Eternal Sunshine of the Spotless Mind", year: 2004, runtime: 108, genres: [878, 18, 10749], directors: ["Michel Gondry"], cast: ["Jim Carrey", "Kate Winslet", "Kirsten Dunst"], lang: "en", vote: 8.1, popularity: 77, imdb: "tt0338013", overview: "After a painful breakup, a man undergoes a procedure to erase his ex from his memory." },
  { id: 807, title: "Se7en", year: 1995, runtime: 127, genres: [80, 9648, 53], directors: ["David Fincher"], cast: ["Brad Pitt", "Morgan Freeman", "Gwyneth Paltrow"], lang: "en", vote: 8.4, popularity: 86, imdb: "tt0114369", overview: "Two detectives hunt a serial killer who uses the seven deadly sins as his motives." },
  { id: 274, title: "The Silence of the Lambs", year: 1991, runtime: 119, genres: [80, 18, 53, 27], directors: ["Jonathan Demme"], cast: ["Jodie Foster", "Anthony Hopkins", "Scott Glenn"], lang: "en", vote: 8.3, popularity: 80, imdb: "tt0102926", overview: "An FBI trainee seeks the help of an imprisoned cannibal to catch another killer." },
  { id: 546554, title: "Knives Out", year: 2019, runtime: 131, genres: [35, 80, 9648], directors: ["Rian Johnson"], cast: ["Daniel Craig", "Chris Evans", "Ana de Armas"], lang: "en", vote: 7.8, popularity: 79, imdb: "tt8946378", overview: "A detective investigates the death of a wealthy crime novelist and his very suspicious family." },
  { id: 493922, title: "Hereditary", year: 2018, runtime: 127, genres: [27, 9648, 53], directors: ["Ari Aster"], cast: ["Toni Collette", "Alex Wolff", "Milly Shapiro"], lang: "en", vote: 7.3, popularity: 74, imdb: "tt7784604", overview: "After their grandmother dies, a family begins to unravel cryptic and terrifying secrets." },
  { id: 530385, title: "Midsommar", year: 2019, runtime: 148, genres: [27, 18, 9648], directors: ["Ari Aster"], cast: ["Florence Pugh", "Jack Reynor", "William Jackson Harper"], lang: "en", vote: 7.1, popularity: 72, imdb: "tt8772262", overview: "A grieving couple travels to a Swedish midsummer festival that turns sinister." },
  { id: 361743, title: "Top Gun: Maverick", year: 2022, runtime: 131, genres: [28, 18], directors: ["Joseph Kosinski"], cast: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"], lang: "en", vote: 8.2, popularity: 100, imdb: "tt1745960", overview: "Maverick returns to train a new generation of pilots for a near-impossible mission." },
  { id: 862, title: "Toy Story", year: 1995, runtime: 81, genres: [16, 12, 35, 10751], directors: ["John Lasseter"], cast: ["Tom Hanks", "Tim Allen", "Don Rickles"], lang: "en", vote: 8.0, popularity: 83, imdb: "tt0114709", overview: "A cowboy doll feels threatened when a flashy space ranger becomes his owner's favorite toy." },
  { id: 105, title: "Back to the Future", year: 1985, runtime: 116, genres: [12, 35, 878], directors: ["Robert Zemeckis"], cast: ["Michael J. Fox", "Christopher Lloyd", "Lea Thompson"], lang: "en", vote: 8.3, popularity: 81, imdb: "tt0088763", overview: "A teenager is accidentally sent thirty years into the past in a time-traveling DeLorean." },
  { id: 329, title: "Jurassic Park", year: 1993, runtime: 127, genres: [12, 878], directors: ["Steven Spielberg"], cast: ["Sam Neill", "Laura Dern", "Jeff Goldblum"], lang: "en", vote: 7.9, popularity: 84, imdb: "tt0107290", overview: "A theme park of cloned dinosaurs breaks down during a preview tour." },
  { id: 597, title: "Titanic", year: 1997, runtime: 194, genres: [18, 10749], directors: ["James Cameron"], cast: ["Leonardo DiCaprio", "Kate Winslet", "Billy Zane"], lang: "en", vote: 7.9, popularity: 92, imdb: "tt0120338", overview: "A young aristocrat and a penniless artist fall in love aboard the doomed ship." },
  { id: 769, title: "Goodfellas", year: 1990, runtime: 145, genres: [18, 80], directors: ["Martin Scorsese"], cast: ["Robert De Niro", "Ray Liotta", "Joe Pesci"], lang: "en", vote: 8.5, popularity: 78, imdb: "tt0099685", overview: "The rise and fall of a mob associate over three decades in New York." },
  { id: 120, title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, runtime: 179, genres: [12, 14, 28], directors: ["Peter Jackson"], cast: ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"], lang: "en", vote: 8.4, popularity: 95, imdb: "tt0120737", overview: "A humble hobbit sets out with eight companions to destroy a ring of terrible power." },
  { id: 128, title: "Princess Mononoke", year: 1997, runtime: 134, genres: [12, 14, 16], directors: ["Hayao Miyazaki"], cast: ["Yōji Matsuda", "Yuriko Ishida", "Yūko Tanaka"], lang: "ja", vote: 8.3, popularity: 70, imdb: "tt0119698", overview: "A cursed prince is caught in a war between forest gods and the humans consuming the land." },
  { id: 8392, title: "My Neighbor Totoro", year: 1988, runtime: 86, genres: [14, 16, 10751], directors: ["Hayao Miyazaki"], cast: ["Noriko Hidaka", "Chika Sakamoto", "Shigesato Itoi"], lang: "ja", vote: 8.1, popularity: 72, imdb: "tt0096283", overview: "Two sisters moving to the countryside befriend gentle forest spirits." },
  { id: 2062, title: "Ratatouille", year: 2007, runtime: 111, genres: [16, 35, 10751, 14], directors: ["Brad Bird"], cast: ["Patton Oswalt", "Ian Holm", "Lou Romano"], lang: "en", vote: 7.8, popularity: 76, imdb: "tt0382932", overview: "A rat with a gift for cooking teams up with a young kitchen worker in Paris." },
  { id: 150540, title: "Inside Out", year: 2015, runtime: 95, genres: [16, 10751, 12, 18, 35], directors: ["Pete Docter"], cast: ["Amy Poehler", "Phyllis Smith", "Richard Kind"], lang: "en", vote: 7.9, popularity: 80, imdb: "tt2096673", overview: "The emotions inside a girl's mind try to guide her through a difficult move." },
  { id: 37165, title: "The Truman Show", year: 1998, runtime: 103, genres: [35, 18], directors: ["Peter Weir"], cast: ["Jim Carrey", "Laura Linney", "Ed Harris"], lang: "en", vote: 8.1, popularity: 74, imdb: "tt0120382", overview: "An insurance salesman discovers his whole life is a television show." },
  { id: 137, title: "Groundhog Day", year: 1993, runtime: 101, genres: [10749, 14, 18, 35], directors: ["Harold Ramis"], cast: ["Bill Murray", "Andie MacDowell", "Chris Elliott"], lang: "en", vote: 7.6, popularity: 60, imdb: "tt0107048", overview: "A cynical weatherman is forced to relive the same day over and over." },
  { id: 10625, title: "Mean Girls", year: 2004, runtime: 97, genres: [35], directors: ["Mark Waters"], cast: ["Lindsay Lohan", "Rachel McAdams", "Tina Fey"], lang: "en", vote: 7.2, popularity: 66, imdb: "tt0377092", overview: "A new student infiltrates her high school's most powerful clique." },
  { id: 8363, title: "Superbad", year: 2007, runtime: 113, genres: [35], directors: ["Greg Mottola"], cast: ["Jonah Hill", "Michael Cera", "Christopher Mintz-Plasse"], lang: "en", vote: 7.2, popularity: 58, imdb: "tt0829482", overview: "Two inseparable friends try to make the most of one last party before graduation." },
  { id: 4348, title: "Pride & Prejudice", year: 2005, runtime: 129, genres: [18, 10749], directors: ["Joe Wright"], cast: ["Keira Knightley", "Matthew Macfadyen", "Brenda Blethyn"], lang: "en", vote: 8.1, popularity: 69, imdb: "tt0414387", overview: "Elizabeth Bennet and Mr. Darcy clash, misjudge each other and slowly fall in love." },
  { id: 289, title: "Casablanca", year: 1942, runtime: 102, genres: [18, 10749], directors: ["Michael Curtiz"], cast: ["Humphrey Bogart", "Ingrid Bergman", "Paul Henreid"], lang: "en", vote: 8.2, popularity: 50, imdb: "tt0034583", overview: "A nightclub owner in wartime Morocco must choose between love and doing the right thing." },
  { id: 539, title: "Psycho", year: 1960, runtime: 109, genres: [27, 9648, 53], directors: ["Alfred Hitchcock"], cast: ["Anthony Perkins", "Janet Leigh", "Vera Miles"], lang: "en", vote: 8.4, popularity: 58, imdb: "tt0054215", overview: "A secretary on the run checks into a remote motel run by a strange young man." },
  { id: 62, title: "2001: A Space Odyssey", year: 1968, runtime: 149, genres: [878, 9648, 12], directors: ["Stanley Kubrick"], cast: ["Keir Dullea", "Gary Lockwood", "William Sylvester"], lang: "en", vote: 8.1, popularity: 62, imdb: "tt0062622", overview: "A voyage to Jupiter guided by a mysterious monolith and a computer with a mind of its own." },
  { id: 346, title: "Seven Samurai", year: 1954, runtime: 207, genres: [28, 18], directors: ["Akira Kurosawa"], cast: ["Toshirō Mifune", "Takashi Shimura", "Keiko Tsushima"], lang: "ja", vote: 8.5, popularity: 45, imdb: "tt0047478", overview: "A poor village hires seven masterless samurai to defend it against bandits." },
  { id: 103, title: "Taxi Driver", year: 1976, runtime: 114, genres: [80, 18], directors: ["Martin Scorsese"], cast: ["Robert De Niro", "Jodie Foster", "Cybill Shepherd"], lang: "en", vote: 8.1, popularity: 64, imdb: "tt0075314", overview: "A disturbed veteran working as a night-shift cab driver spirals into violence." },
  { id: 77, title: "Memento", year: 2000, runtime: 113, genres: [9648, 53], directors: ["Christopher Nolan"], cast: ["Guy Pearce", "Carrie-Anne Moss", "Joe Pantoliano"], lang: "en", vote: 8.2, popularity: 70, imdb: "tt0209144", overview: "A man with short-term memory loss hunts his wife's killer using notes and tattoos." },
  { id: 670, title: "Oldboy", year: 2003, runtime: 120, genres: [18, 53, 9648, 28], directors: ["Park Chan-wook"], cast: ["Choi Min-sik", "Yoo Ji-tae", "Kang Hye-jung"], lang: "ko", vote: 8.3, popularity: 66, imdb: "tt0364569", overview: "Released after fifteen years of mysterious imprisonment, a man seeks his captor." },
  { id: 6977, title: "No Country for Old Men", year: 2007, runtime: 122, genres: [80, 18, 53], directors: ["Joel Coen", "Ethan Coen"], cast: ["Tommy Lee Jones", "Javier Bardem", "Josh Brolin"], lang: "en", vote: 7.9, popularity: 67, imdb: "tt0477348", overview: "A hunter stumbles on drug money and is pursued by a relentless killer." },
  { id: 64690, title: "Drive", year: 2011, runtime: 100, genres: [18, 53, 80], directors: ["Nicolas Winding Refn"], cast: ["Ryan Gosling", "Carey Mulligan", "Bryan Cranston"], lang: "en", vote: 7.6, popularity: 68, imdb: "tt0780504", overview: "A quiet stunt driver who moonlights as a getaway driver gets caught in a heist gone wrong." },
  { id: 210577, title: "Gone Girl", year: 2014, runtime: 149, genres: [9648, 53, 18], directors: ["David Fincher"], cast: ["Ben Affleck", "Rosamund Pike", "Neil Patrick Harris"], lang: "en", vote: 7.9, popularity: 76, imdb: "tt2267998", overview: "When his wife disappears, a husband becomes the prime suspect in a media frenzy." },
  { id: 1124, title: "The Prestige", year: 2006, runtime: 130, genres: [18, 9648, 878], directors: ["Christopher Nolan"], cast: ["Hugh Jackman", "Christian Bale", "Michael Caine"], lang: "en", vote: 8.2, popularity: 75, imdb: "tt0482571", overview: "Two rival magicians' obsession with outdoing each other turns dangerous." },
  { id: 16869, title: "Inglourious Basterds", year: 2009, runtime: 153, genres: [18, 53, 10752], directors: ["Quentin Tarantino"], cast: ["Brad Pitt", "Christoph Waltz", "Mélanie Laurent"], lang: "en", vote: 8.2, popularity: 79, imdb: "tt0361748", overview: "A band of soldiers and a cinema owner plot separately to bring down Nazi leaders." },
  { id: 792307, title: "Poor Things", year: 2023, runtime: 141, genres: [878, 10749, 35], directors: ["Yorgos Lanthimos"], cast: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"], lang: "en", vote: 7.7, popularity: 105, imdb: "tt14230458", overview: "A woman brought back to life by an eccentric scientist sets off to discover the world." },
  { id: 915935, title: "Anatomy of a Fall", year: 2023, runtime: 151, genres: [80, 18, 9648], directors: ["Justine Triet"], cast: ["Sandra Hüller", "Swann Arlaud", "Milo Machado-Graner"], lang: "fr", vote: 7.7, popularity: 70, imdb: "tt17009710", overview: "A writer stands trial for her husband's death, with their son as the key witness." },
  { id: 840430, title: "The Holdovers", year: 2023, runtime: 133, genres: [35, 18], directors: ["Alexander Payne"], cast: ["Paul Giamatti", "Da'Vine Joy Randolph", "Dominic Sessa"], lang: "en", vote: 7.7, popularity: 72, imdb: "tt14849194", overview: "A cranky teacher is stuck supervising a student over the Christmas break." },
  { id: 937287, title: "Challengers", year: 2024, runtime: 131, genres: [10749, 18], directors: ["Luca Guadagnino"], cast: ["Zendaya", "Mike Faist", "Josh O'Connor"], lang: "en", vote: 7.0, popularity: 110, imdb: "tt16426418", overview: "A tennis prodigy turned coach makes her husband a champion, until he faces her ex." },
  { id: 933260, title: "The Substance", year: 2024, runtime: 141, genres: [27, 878], directors: ["Coralie Fargeat"], cast: ["Demi Moore", "Margaret Qualley", "Dennis Quaid"], lang: "en", vote: 7.1, popularity: 140, imdb: "tt17526714", overview: "A fading star takes a black-market drug that creates a younger, better version of herself." },
  { id: 1064213, title: "Anora", year: 2024, runtime: 139, genres: [35, 18, 10749], directors: ["Sean Baker"], cast: ["Mikey Madison", "Mark Eydelshteyn", "Yura Borisov"], lang: "en", vote: 7.0, popularity: 120, imdb: "tt28607951", overview: "A young dancer from Brooklyn impulsively marries the son of a Russian oligarch." },
  { id: 974576, title: "Conclave", year: 2024, runtime: 120, genres: [18, 9648, 53], directors: ["Edward Berger"], cast: ["Ralph Fiennes", "Stanley Tucci", "Isabella Rossellini"], lang: "en", vote: 7.2, popularity: 115, imdb: "tt20215234", overview: "A cardinal oversees the secretive election of a new pope and uncovers a web of secrets." },
  { id: 331482, title: "Little Women", year: 2019, runtime: 135, genres: [18, 10749], directors: ["Greta Gerwig"], cast: ["Saoirse Ronan", "Emma Watson", "Florence Pugh"], lang: "en", vote: 7.9, popularity: 73, imdb: "tt3281548", overview: "The March sisters come of age and pursue their own paths in post-Civil War America." },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse", year: 2023, runtime: 140, genres: [16, 28, 12, 878], directors: ["Joaquim Dos Santos", "Kemp Powers", "Justin K. Thompson"], cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac"], lang: "en", vote: 8.3, popularity: 118, imdb: "tt9362722", overview: "Miles Morales is catapulted across the multiverse and clashes with a society of Spider-People." },
  { id: 466420, title: "Killers of the Flower Moon", year: 2023, runtime: 206, genres: [80, 18, 36], directors: ["Martin Scorsese"], cast: ["Leonardo DiCaprio", "Lily Gladstone", "Robert De Niro"], lang: "en", vote: 7.5, popularity: 78, imdb: "tt5537002", overview: "Members of the Osage Nation are murdered one by one after oil is found on their land." },
  { id: 705996, title: "Decision to Leave", year: 2022, runtime: 139, genres: [80, 18, 9648, 10749], directors: ["Park Chan-wook"], cast: ["Tang Wei", "Park Hae-il", "Lee Jung-hyun"], lang: "ko", vote: 7.4, popularity: 52, imdb: "tt12477480", overview: "A detective investigating a man's death becomes infatuated with the widow." },
  { id: 426426, title: "Roma", year: 2018, runtime: 135, genres: [18], directors: ["Alfonso Cuarón"], cast: ["Yalitza Aparicio", "Marina de Tavira", "Diego Cortina Autrey"], lang: "es", vote: 7.6, popularity: 50, imdb: "tt6155172", overview: "A year in the life of a domestic worker for a middle-class family in 1970s Mexico City." },
  { id: 398818, title: "Call Me by Your Name", year: 2017, runtime: 132, genres: [10749, 18], directors: ["Luca Guadagnino"], cast: ["Timothée Chalamet", "Armie Hammer", "Michael Stuhlbarg"], lang: "en", vote: 8.1, popularity: 65, imdb: "tt5726616", overview: "A summer romance blossoms between a teenager and a visiting scholar in northern Italy." },
  { id: 1018, title: "Mulholland Drive", year: 2001, runtime: 147, genres: [53, 18, 9648], directors: ["David Lynch"], cast: ["Naomi Watts", "Laura Harring", "Justin Theroux"], lang: "en", vote: 7.8, popularity: 60, imdb: "tt0166924", overview: "An aspiring actress and an amnesiac woman search for answers in a dreamlike Los Angeles." },
  { id: 346648, title: "Paddington 2", year: 2017, runtime: 104, genres: [12, 35, 10751], directors: ["Paul King"], cast: ["Ben Whishaw", "Hugh Grant", "Hugh Bonneville"], lang: "en", vote: 7.5, popularity: 62, imdb: "tt4468740", overview: "Paddington takes on odd jobs to buy a gift, but ends up framed for theft." },
  { id: 24, title: "Kill Bill: Vol. 1", year: 2003, runtime: 111, genres: [28, 80], directors: ["Quentin Tarantino"], cast: ["Uma Thurman", "Lucy Liu", "Vivica A. Fox"], lang: "en", vote: 8.0, popularity: 80, imdb: "tt0266697", overview: "A former assassin wakes from a coma and sets out for revenge." },
  { id: 808, title: "Shrek", year: 2001, runtime: 90, genres: [16, 35, 14, 12, 10751], directors: ["Andrew Adamson", "Vicky Jenson"], cast: ["Mike Myers", "Eddie Murphy", "Cameron Diaz"], lang: "en", vote: 7.7, popularity: 85, imdb: "tt0126029", overview: "A grumpy ogre sets out to rescue a princess to get his swamp back." },
];

export const FIXTURE_REGIONS = [
  { iso_3166_1: "US", english_name: "United States" },
  { iso_3166_1: "GB", english_name: "United Kingdom" },
  { iso_3166_1: "CA", english_name: "Canada" },
  { iso_3166_1: "AU", english_name: "Australia" },
  { iso_3166_1: "IE", english_name: "Ireland" },
  { iso_3166_1: "ES", english_name: "Spain" },
  { iso_3166_1: "MX", english_name: "Mexico" },
  { iso_3166_1: "AR", english_name: "Argentina" },
  { iso_3166_1: "BR", english_name: "Brazil" },
  { iso_3166_1: "FR", english_name: "France" },
  { iso_3166_1: "DE", english_name: "Germany" },
  { iso_3166_1: "IT", english_name: "Italy" },
  { iso_3166_1: "NL", english_name: "Netherlands" },
  { iso_3166_1: "SE", english_name: "Sweden" },
  { iso_3166_1: "JP", english_name: "Japan" },
  { iso_3166_1: "KR", english_name: "South Korea" },
  { iso_3166_1: "IN", english_name: "India" },
];

interface FixtureProvider {
  provider_id: number;
  provider_name: string;
}

const GLOBAL_PROVIDERS: FixtureProvider[] = [
  { provider_id: 8, provider_name: "Netflix" },
  { provider_id: 9, provider_name: "Amazon Prime Video" },
  { provider_id: 337, provider_name: "Disney Plus" },
  { provider_id: 350, provider_name: "Apple TV+" },
  { provider_id: 11, provider_name: "MUBI" },
];

const REGIONAL_PROVIDERS: Record<string, FixtureProvider[]> = {
  US: [
    { provider_id: 1899, provider_name: "Max" },
    { provider_id: 15, provider_name: "Hulu" },
    { provider_id: 258, provider_name: "The Criterion Channel" },
    { provider_id: 531, provider_name: "Paramount Plus" },
    { provider_id: 386, provider_name: "Peacock Premium" },
  ],
  GB: [
    { provider_id: 38, provider_name: "BBC iPlayer" },
    { provider_id: 39, provider_name: "Now TV" },
  ],
  ES: [
    { provider_id: 1899, provider_name: "Max" },
    { provider_id: 63, provider_name: "Filmin" },
    { provider_id: 149, provider_name: "Movistar Plus+" },
  ],
  MX: [{ provider_id: 1899, provider_name: "Max" }],
};

export const RENT_PROVIDERS: FixtureProvider[] = [
  { provider_id: 2, provider_name: "Apple TV" },
  { provider_id: 3, provider_name: "Google Play Movies" },
];

export function fixtureProvidersForRegion(region: string): FixtureProvider[] {
  return [...GLOBAL_PROVIDERS, ...(REGIONAL_PROVIDERS[region] ?? [])];
}
