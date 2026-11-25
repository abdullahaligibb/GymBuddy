import React from "react";
import { createRoot } from "react-dom/client";
import { GymBuddyApp } from "../../App";
import { createMockApi } from "../../src/services/mockApi";
import { mapApiExercise } from "../../src/services/exerciseCatalogApi";

const api = createMockApi();
api.listExercises = async () => [mapApiExercise({ id: "external-test", name: "Katalogtest Presse", beschreibung: "Anleitung aus dem geladenen Katalog", targetMuscles: ["chest"], equipments: ["machine"] })];
createRoot(document.getElementById("root")!).render(<GymBuddyApp api={api} />);
