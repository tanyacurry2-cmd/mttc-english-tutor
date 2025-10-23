import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

type Props = { seconds: number; onExpire: () => void; tickMs?: number; style?: any; };

export default function Countdown({ seconds, onExpire, tickMs = 1000, style }: Props) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => setLeft(t => t - 1), tickMs);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [tickMs]);

  useEffect(() => {
    if (left <= 0) {
      if (ref.current) clearInterval(ref.current);
      onExpire();
    }
  }, [left, onExpire]);

  const m = Math.max(0, Math.floor(left / 60));
  const s = Math.max(0, left % 60);
  return <Text style={style}>{`${m}:${s.toString().padStart(2, "0")}`}</Text>;
}
