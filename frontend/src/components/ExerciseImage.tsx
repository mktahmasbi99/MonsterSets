interface Props {
  imageKey: string | null;
  name: string;
  size?: "small" | "large";
}

export function ExerciseImage({ imageKey, name, size = "small" }: Props) {
  if (!imageKey) return <div className={`exercise-image image-fallback ${size}`}>{name.slice(0, 1).toUpperCase()}</div>;
  return (
    <div className={`exercise-image ${size}`}>
      <img src={`/exercise-assets/${imageKey}/frame-1.png`} alt="" loading="lazy" />
    </div>
  );
}

