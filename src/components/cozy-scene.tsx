/** Mascots sit behind the ribbon; their paws overlap its front edge. */
export function EdgeFriends({ single = false }: { single?: boolean }) {
  return <div className={`edge-friends ${single ? "edge-single" : ""}`} aria-hidden="true">
    {(single ? ["dog"] : ["cat", "dog"]).map(kind => <div className={`edge-pet edge-${kind}`} key={kind}>
      <img src={`/illustrations/edge-${kind}.png`} alt="" width={150} height={140} />
      <img className="edge-paws" src={`/illustrations/edge-${kind}.png`} alt="" width={150} height={140} />
    </div>)}
    <span className="edge-ribbon" />
  </div>;
}
export function CozyScene({ className = "" }: { className?: string }) {
  return <div className={`cozy-scene cozy-ledge ${className}`}><EdgeFriends /></div>;
}
export function CozyCompanion() {
  return <div className="cozy-companion companion-ledge"><EdgeFriends single /></div>;
}
