<script lang="ts">
  export let namespaces: string[];
  export let pods: string[];
  export let policyTypes: string[];
  export let selectedNamespace: string;
  export let selectedPod: string;
  export let selectedPolicyType: string;
</script>

<div class="filter-section">
  <label>
    Namespace:
    <select bind:value={selectedNamespace}>
      <option value="">All Namespaces</option>
      {#each namespaces as namespace}
        <option value={namespace}>{namespace}</option>
      {/each}
    </select>
  </label>

  <label>
    Pod:
    <select bind:value={selectedPod}>
      <option value="">All Pods</option>
      {#each pods as pod}
        <option value={pod}>{pod}</option>
      {/each}
    </select>
  </label>

  <label>
    Policy Type:
    <select bind:value={selectedPolicyType}>
      <option value="">All Types</option>
      {#each policyTypes as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
  </label>
</div>

<style>
  .filter-section {
    margin: 20px 0;
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  label {
    font-size: 1em;
    color: #fff;
  }

  select {
    margin-left: 10px;
    padding: 5px;
  }
</style>
