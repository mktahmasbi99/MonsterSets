import { exercises as artworkCatalog } from "@bryllim/workout-guide";
import { Check, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { equipmentLabels } from "../lib/format";
import type { Equipment, Exercise, ExercisePayload, MeasurementType } from "../lib/types";
import { ExerciseImage } from "./ExerciseImage";

const equipment = Object.entries(equipmentLabels) as [Equipment, string][];

interface Props {
  exercise?: Exercise;
  onSaved: (exercise: Exercise) => void;
  onCancel: () => void;
}

export function ExerciseEditor({ exercise, onSaved, onCancel }: Props) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [measurement, setMeasurement] = useState<MeasurementType>(exercise?.measurementType ?? "repetitions");
  const [resistance, setResistance] = useState(exercise?.defaultResistanceKind ?? "bodyweight");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment>(exercise?.defaultEquipment ?? "dumbbell");
  const [customEquipment, setCustomEquipment] = useState(exercise?.defaultCustomEquipment ?? "");
  const [weight, setWeight] = useState(exercise?.defaultWeightKg ?? "");
  const [imageKey, setImageKey] = useState<string | null>(exercise?.imageKey ?? null);
  const [imageSearch, setImageSearch] = useState("");
  const [showPictures, setShowPictures] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const pictures = useMemo(() => {
    const query = imageSearch.trim().toLocaleLowerCase();
    return artworkCatalog.filter((item) => !query || item.name.toLocaleLowerCase().includes(query));
  }, [imageSearch]);

  async function save() {
    setSaving(true);
    setError("");
    const payload: ExercisePayload = {
      name,
      defaultResistanceKind: resistance,
      defaultEquipment: resistance === "external" ? selectedEquipment : null,
      defaultCustomEquipment: resistance === "external" && selectedEquipment === "other" ? customEquipment : null,
      defaultWeightKg: resistance === "external" ? weight || null : null,
      imageKey,
    };
    try {
      const saved = exercise
        ? await api.updateExercise(exercise.id, payload)
        : await api.createExercise({ ...payload, measurementType: measurement });
      onSaved(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save exercise.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack editor" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <label>Exercise name<input value={name} onChange={(event) => setName(event.target.value)} autoFocus required maxLength={100} /></label>
      <fieldset>
        <legend>Measurement</legend>
        <div className="segmented">
          <button type="button" className={measurement === "repetitions" ? "selected" : ""} onClick={() => setMeasurement("repetitions")} disabled={Boolean(exercise)}>Repetitions</button>
          <button type="button" className={measurement === "duration" ? "selected" : ""} onClick={() => setMeasurement("duration")} disabled={Boolean(exercise)}>Duration</button>
        </div>
        {exercise && <small>Measurement type is permanent after creation.</small>}
      </fieldset>
      <fieldset>
        <legend>Default resistance</legend>
        <div className="segmented">
          <button type="button" className={resistance === "bodyweight" ? "selected" : ""} onClick={() => setResistance("bodyweight")}>Bodyweight</button>
          <button type="button" className={resistance === "external" ? "selected" : ""} onClick={() => setResistance("external")}>External</button>
        </div>
      </fieldset>
      {resistance === "external" && <div className="form-grid">
        <label>Equipment<select value={selectedEquipment} onChange={(event) => setSelectedEquipment(event.target.value as Equipment)}>{equipment.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Default kg <span className="optional">optional</span><input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="e.g. 12.5" /></label>
        {selectedEquipment === "other" && <label className="full">Equipment name<input value={customEquipment} onChange={(event) => setCustomEquipment(event.target.value)} required /></label>}
      </div>}
      <div>
        <span className="field-label">Picture</span>
        <button type="button" className="picture-choice" onClick={() => setShowPictures(!showPictures)}>
          <ExerciseImage imageKey={imageKey} name={name || "Exercise"} />
          <span>{imageKey ? artworkCatalog.find((item) => item.slug === imageKey)?.name ?? imageKey : "No picture"}</span>
        </button>
      </div>
      {showPictures && <div className="picture-picker">
        <input type="search" placeholder="Search pictures" value={imageSearch} onChange={(event) => setImageSearch(event.target.value)} />
        <div className="picture-grid">
          <button type="button" className={imageKey === null ? "selected" : ""} onClick={() => { setImageKey(null); setShowPictures(false); }}><ImageOff /><span>No picture</span></button>
          {pictures.map((item) => <button type="button" key={item.slug} className={imageKey === item.slug ? "selected" : ""} onClick={() => { setImageKey(item.slug); setShowPictures(false); }}><ExerciseImage imageKey={item.slug} name={item.name} /><span>{item.name}</span></button>)}
        </div>
      </div>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit" className="primary" disabled={saving || !name.trim()}><Check />{saving ? "Saving…" : "Save exercise"}</button></div>
    </form>
  );
}

