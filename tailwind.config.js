module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        widgetBg: "#1E1123",
        widgetPrimary: "#130E18",
        widgetSecondary: "#2c2533",
        greyText: "#95859c",
      },
      fontFamily: {
        rajdhani: ["Rajdhani"],
        dm_sans: ["DM Sans"],
        inter: ["Inter"],
      },
      backgroundImage: {
        gradient: "linear-gradient(271.77deg, #00FFFF -9.9%, #00F9A9 155.61%)",
        hoverGradient: "linear-gradient(90deg, #00ffff 100%, #00f9a9 0%)",
      },
    },
  },
  plugins: [],
};
