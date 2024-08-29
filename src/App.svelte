<script lang="ts">
  // Importing all the necessary components used in the app
  import NetworkPolicyVisualizer from "./lib/components/Visualizer.svelte";
  import Modal from "./lib/components/Modal.svelte";
  import Tooltip from "./lib/components/Tooltip.svelte";
  import Icon from "./lib/components/Icon.svelte";
  import Filter from "./lib/components/Filter.svelte";
  import Loader from "./lib/components/Loader.svelte";
  import { onMount } from "svelte";

  // Importing utility functions for data fetching and refreshing
  import { fetchData, refreshData } from "./lib/utils/app/utility";

  // Importing stores to manage shared state across the app
  import {
    networkPolicies,
    rawRelationships,
    hasSecurityIssues,
    hasConfigurationIssues,
    tooltipContent,
    tooltipPosition,
    tooltipVisible,
  } from "./stores";

  // Local variables for managing UI state
  let showModal = false; // Controls the visibility of the modal
  let dataLoaded = false; // Indicates whether the data has been successfully loaded

  // Variables for filters used in the application
  let selectedNamespace = "";
  let selectedPod = "";
  let selectedPolicyType = "";
  let namespaces = []; // List of available namespaces
  let pods = []; // List of available pods
  let policyTypes = ["Ingress", "Egress"]; // Types of policies to filter by

  // Function to close the modal
  function closeModal() {
    showModal = false;
  }

  // Fetching data when the component is first mounted
  onMount(async () => {
    const result = await fetchData(); // Fetch data from the backend
    if (result) {
      dataLoaded = true; // Set the dataLoaded flag to true when data is fetched successfully
      
      // Populate the namespaces and pods arrays based on fetched data
      namespaces = [
        ...new Set($networkPolicies.map((policy) => policy.namespace)),
      ];
      pods = [
        ...new Set(
          $rawRelationships.flatMap((rel) =>
            [rel.podName, rel.relatedPod].filter(Boolean),
          ),
        ),
      ];
    }
  });

  // Reactive statement to filter policies based on the selected namespace, pod, and policy type
  $: policies = $networkPolicies.filter((policy) => {
    const namespaceMatch = selectedNamespace
      ? policy.namespace === selectedNamespace
      : true;
    const policyTypeMatch = selectedPolicyType
      ? policy.policyTypes.includes(selectedPolicyType)
      : true;
    const podMatch = selectedPod
      ? $rawRelationships.some(
          (relationship) =>
            (relationship.podName === selectedPod ||
              relationship.relatedPod === selectedPod) &&
            (relationship.namespace === policy.namespace ||
              relationship.relatedNamespace === policy.namespace),
        )
      : true;
    return namespaceMatch && policyTypeMatch && podMatch;
  });

  // Reactive statement to filter relationships based on the selected filters
  $: relationships = $rawRelationships.filter((relationship) => {
    const namespaceMatch = selectedNamespace
      ? relationship.namespace === selectedNamespace ||
        relationship.relatedNamespace === selectedNamespace
      : true;
    const podMatch = selectedPod
      ? relationship.podName === selectedPod ||
        relationship.relatedPod === selectedPod
      : true;
    const policyTypeMatch = selectedPolicyType
      ? relationship.direction.toLowerCase() ===
        selectedPolicyType.toLowerCase()
      : true;
    return namespaceMatch && podMatch && policyTypeMatch;
  });
</script>

<main>
  <div>
    <h3>Kubernetes Network Policy Visualizer</h3>
    
    <!-- Button to open the modal for understanding visualizations -->
    <button on:click={() => (showModal = true)}>
      Understanding the Visualizations
    </button>

    <!-- Button to refresh network policies data -->
    <button
      type="button"
      class="close"
      on:click={refreshData}
      aria-label="Refresh Policies"
    >
      Refresh Network Policies
    </button>
  </div>

  <!-- Displaying the security/configuration issues icon with a tooltip -->
  <Icon />

  <!-- Tooltip component for additional information -->
  <Tooltip />

  <!-- Filter component for selecting namespace, pod, and policy type -->
  <Filter
    {namespaces}
    {pods}
    {policyTypes}
    bind:selectedNamespace
    bind:selectedPod
    bind:selectedPolicyType
  />

  <div>
    <!-- Display the network policy visualizer once data is loaded, otherwise show a loader -->
    {#if dataLoaded}
      <NetworkPolicyVisualizer {policies} {relationships} />
    {:else}
      <Loader />
    {/if}
  </div>

  <!-- Modal component, visible when `showModal` is true -->
  <Modal {showModal} {closeModal} />
</main>

<style>
  /* Styling for the main content */
  main {
    max-width: 90%;
    margin: 0 auto;
    text-align: center;
  }

  /* Styling for buttons */
  button {
    margin: 20px 0;
  }
</style>
