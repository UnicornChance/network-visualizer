<script lang="ts">
  import {
    tooltipContent,
    tooltipPosition,
    tooltipVisible,
  } from "../../stores";

  $: content = $tooltipContent;
  $: position = $tooltipPosition;
  $: visible = $tooltipVisible;
</script>

<div
  class="tooltip"
  style="top: {position.top}px; left: {position.left}px;"
  class:visible
>
  <ul>
    {#each content as issue}
      <li>{issue.message}</li>
    {/each}
  </ul>
</div>

<style>
  .tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 10px;
    border-radius: 4px;
    font-size: 0.9em;
    z-index: 1000;
    display: none;
  }

  .tooltip.visible {
    display: block;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
    padding: 0;
  }
</style>
