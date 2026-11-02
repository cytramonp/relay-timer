// Only low-risk text edits are buffered. Start/pause/finish/import use write(),
// which cancels an older edit and persists the complete latest snapshot.
export function bufferedWriter<T>(persist: (value: T) => boolean, delay = 300) {
  let pending: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const discard = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pending = null;
  };
  const write = (value: T) => {
    discard();
    return persist(value);
  };
  const flush = () => {
    if (!pending) return true;
    return write(pending.value);
  };
  return {
    write,
    flush,
    discard,
    schedule(value: T) {
      discard();
      pending = { value };
      timer = setTimeout(flush, delay);
    },
  };
}
