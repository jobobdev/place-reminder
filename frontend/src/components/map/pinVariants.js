// frontend/src/components/map/pinVariants.js

export function getPinVariant({ type, state = "idle" }) {
  switch (type) {
    case "saved": {
      switch (state) {
        case "highlighted":
          return {
            icon: "saved_highlighted",
            size: 40,
            anchor: [20, 34],
            zIndex: 3,
          };

        case "alert":
          return {
            icon: "saved_alert",
            size: 42,
            anchor: [21, 36],
            zIndex: 4,
            // animation: "pulse" (추후)
          };

        case "idle":
        default:
          return {
            icon: "saved",
            size: 28,
            anchor: [14, 28],
            zIndex: 1,
          };
      }
    }

    case "poi": {
      switch (state) {
        case "highlighted":
          return {
            icon: "poi_highlighted",
            size: 40,
            anchor: [20, 34],
            zIndex: 3,
          };

        case "idle":
        default:
          return null; // 👉 POI는 idle일 때 지도에 존재하지 않음
      }
    }

    case "current": {
      switch (state) {
        case "follow":
          return {
            icon: "current_follow",
            size: 18,
            anchor: [9, 18],
            zIndex: 5,
          };

        case "idle":
        default:
          return {
            icon: "current",
            size: 16,
            anchor: [8, 16],
            zIndex: 4,
          };
      }
    }

    default:
      return null;
  }
}
