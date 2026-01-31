// frontend/src/components/TopControls.jsx
import SearchBar from "./SearchBar.jsx";
import menuBurgerIcon from "../assets/icons/menu_burger_icon.svg";

function TopControls({
  currentPosition,
  onPlaceSelect,
  onOpenMyPage,
  shouldHideTopControls,
}) {
  if (shouldHideTopControls) return null;

  return (
    <div style={accountButtonWrapStyle}>
      <div style={searchBarWrapStyle}>
        <SearchBar
          onPlaceSelect={onPlaceSelect}
          currentPosition={currentPosition}
        />
      </div>
      <button type="button" style={accountButtonStyle} onClick={onOpenMyPage}>
        <img src={menuBurgerIcon} alt="account-menu" width={24} height={24} />
      </button>
    </div>
  );
}

export default TopControls;

const accountButtonWrapStyle = {
  position: "absolute",
  top: 44,
  left: 0,
  right: 0,
  margin: "0 auto",
  width: "90%",
  height: "44px",
  maxWidth: "420px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  zIndex: 1200,
};

const searchBarWrapStyle = {
  flex: 1,
  minWidth: 0,
  height: "44px",
};

const accountButtonStyle = {
  position: "relative",
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "1px solid rgba(0,0,0,0.08)",
  backgroundColor: "#fff",
  display: "flex",
  zIndex: 1200,

  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow:
    "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px",
};
