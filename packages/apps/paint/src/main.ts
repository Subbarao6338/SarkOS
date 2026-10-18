import { App } from "@prozilla-os/core";
import { Paint } from "./components/Paint";
import { Vector2 } from "@prozilla-os/shared";
import { Skin, MacOsSkin, Windows95Skin, MinimalSkin, PixelSkin } from "@prozilla-os/skins";

const paint = new App("Paint", "paint", Paint, { size: new Vector2(680, 520) })
	.setIconUrl("https://os.prozilla.dev/assets/apps/icons/media-viewer.svg")
	.setPinnedByDefault(false)
	.setCategory("Multimedia design")
	.addSkinOverride(MacOsSkin, {
		name: "Paint",
		iconUrl: Skin.assetUrl("/assets/skins/mac/apps/icons/media-viewer.svg"),
	})
	.addSkinOverride(Windows95Skin, {
		name: "Paint",
		iconUrl: Skin.assetUrl("/assets/skins/windows95/apps/icons/media-viewer.svg"),
	})
	.addSkinOverride(MinimalSkin, {
		iconUrl: Skin.assetUrl("/assets/skins/minimal/apps/icons/media-viewer.svg"),
	})
	.addSkinOverride(PixelSkin, {
		iconUrl: Skin.assetUrl("/assets/skins/pixel/apps/icons/media-viewer.png"),
	});

export { paint };
