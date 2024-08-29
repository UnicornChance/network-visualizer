<script lang="ts">
  import {
    hasSecurityIssues,
    hasConfigurationIssues,
    tooltipContent,
    tooltipPosition,
    tooltipVisible,
  } from "../../stores";
  import { showTooltip, hideTooltip } from "../../lib/utils/app/utility";

  $: securityIssues = $hasSecurityIssues;
  $: configIssues = $hasConfigurationIssues;

  const handleMouseEnter = (e: MouseEvent, type: string) => {
    const result = showTooltip(e, type);
    tooltipContent.set(result.tooltipContent);
    tooltipPosition.set(result.tooltipPosition);
    tooltipVisible.set(result.tooltipVisible);
  };

  const handleMouseLeave = () => {
    const result = hideTooltip();
    tooltipVisible.set(result.tooltipVisible);
  };
</script>

<div class="icon-section">
  {#if securityIssues}
    <img
      src="/icons/exclamation.svg"
      alt="Security Issue"
      on:mouseenter={(e) => handleMouseEnter(e, "security")}
      on:mouseleave={handleMouseLeave}
    />
  {/if}
  {#if configIssues}
    <img
      src="/icons/warning.svg"
      alt="Configuration Issue"
      on:mouseenter={(e) => handleMouseEnter(e, "configuration")}
      on:mouseleave={handleMouseLeave}
    />
  {/if}
  {#if !securityIssues && !configIssues}
    <img
      src="/icons/checkmark.svg"
      alt="No Issues"
      title="No issues detected. All network policies are configured correctly."
    />
  {/if}
</div>

<style>
  .icon-section {
    margin: 20px 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon-section img {
    width: 40px;
    height: 40px;
    margin: 0 10px;
  }
</style>
