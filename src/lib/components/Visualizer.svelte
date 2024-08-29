<!-- Visualizer.svelte -->
<script lang="ts">
  import type { Policy, PolicyRelationship } from "../../types";
  import NetworkPolicyGraph from "../visualization/Graph.svelte";
  import NetworkPolicyTable from "../visualization/Table.svelte";

  export let policies: Policy[];
  export let relationships: PolicyRelationship[];
</script>

<NetworkPolicyGraph {relationships} />
<NetworkPolicyTable {policies} />
