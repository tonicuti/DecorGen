import { useCallback, useRef } from "react";
import {
  beginSceneHistoryGesture,
  cancelSceneHistoryGesture,
  endSceneHistoryGesture,
} from "@/store/use-scene-store";

/** One undo step per slider drag (commit on pointer release / onValueCommit). */
export function useSceneSliderHistory() {
  const activeRef = useRef(false);

  const onSlideStart = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    beginSceneHistoryGesture();
  }, []);

  const onSlideCommit = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    endSceneHistoryGesture();
  }, []);

  const onSlideCancel = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    cancelSceneHistoryGesture();
  }, []);

  return { onSlideStart, onSlideCommit, onSlideCancel };
}
