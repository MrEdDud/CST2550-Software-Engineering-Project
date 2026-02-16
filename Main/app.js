let profiles = [
  { name: "Alex, 21", bio: "Loves travel and coffee ☕" },
  { name: "Sara, 23", bio: "Music and sunsets 🎵🌅" },
  { name: "Mike, 25", bio: "Gym & healthy life 💪" }
];

let index = 0;

function nextProfile() {
  index = (index + 1) % profiles.length;
  document.getElementById("name").innerText = profiles[index].name;
  document.getElementById("bio").innerText = profiles[index].bio;
}
