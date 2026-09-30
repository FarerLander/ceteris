import { writeFileSync } from "node:fs";
import { kritikMarkdown } from "../modell/kritik";

writeFileSync("docs/kritikpunkte.md", kritikMarkdown());
console.log("docs/kritikpunkte.md geschrieben");
