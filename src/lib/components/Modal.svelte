<!-- Modal.svelte -->
<script lang="ts">
  export let showModal: boolean;
  export let closeModal: () => void;
</script>

{#if showModal}
  <div class="modal">
    <div class="modal-content">
      <button
        type="button"
        class="close"
        on:click={closeModal}
        aria-label="Close modal">&times;</button
      >

      <h2>Network Policy Graph Visualization</h2>
      <p>
        This visualization displays a network of policies and their
        relationships. It represents namespaces as central nodes and their
        associated pods as smaller nodes within these namespaces. The links
        between namespaces illustrate the relationships between them. Also
        see the icons, these icons are useful for understanding if there are
        any security or configuration issues with your network policy definitions.
      </p>

      <h3>Components:</h3>
      <ul>
        <li>
          <strong>Namespaces (Central Nodes):</strong>
          <ul>
            <li>Represented by squares.</li>
            <li>
              Labeled with the namespace name, styled with a dark background and
              a blue border.
            </li>
          </ul>
        </li>
        <li>
          <strong>Pods (Smaller Nodes):</strong>
          <ul>
            <li>Smaller circles within each namespace square.</li>
            <li>Labeled with short identifiers and colored in light green.</li>
          </ul>
        </li>
        <li>
          <strong>Relationships (Connecting Lines):</strong>
          <ul>
            <li>Lines connect namespaces to indicate relationships.</li>
            <li>
              Arrowheads on lines show the direction from the source to the
              target namespace.
            </li>
          </ul>
        </li>
      </ul>

      <h3>Interactive Features:</h3>
      <ul>
        <li>
          <strong>Hover over icons:</strong>
          <ul>
            <li>
              Hovering over icons will display current issues with network policies.
            </li>
            <li>
              Green Checkmark: Network Policies are secure and configured well.
            </li>
            <li>
              Yellow Warning: There are configuration issues.
            </li>
            <li>
              Red Exclamation: There are security issues.
            </li>
          </ul>
        </li>
        <li>
          <strong>Zoom and Pan:</strong>
          <ul>
            <li>
              Zoom in/out and drag to pan for a closer view of specific areas.
            </li>
          </ul>
        </li>
        <li>
          <strong>Drag-and-Drop:</strong>
          <ul>
            <li>
              Click and drag namespaces to rearrange. Connections and pod
              positions adjust dynamically.
            </li>
          </ul>
        </li>
        <li>
          <strong>Filtering:</strong>
          <ul>
            <li>
              Filters have drop downs of available options and can be combined
              to further filter the data used by both the graph and the table.
            </li>
          </ul>
        </li>
        <li>
          <strong>Hover Highlighting:</strong>
          <ul>
            <li>
              Hover over a namespace to see all network policies associated with
              both the namespace and the pods in that namespace. Hover over a
              pod to see the network policies associated with only that pod.
            </li>
          </ul>
        </li>
      </ul>

      <h3>How to Use:</h3>
      <ul>
        <li>Zoom to get a detailed view of namespaces and pods.</li>
        <li>Drag namespaces to better understand the network's structure.</li>
        <li>
          Filter data for more a better understanding of specific namespaces or
          pods.
        </li>
        <li>
          Hover over various areas of the graph to see highlighted network
          policies of namespaces and pods.
        </li>
      </ul>

      <p>
        This visualization helps you explore the relationships between different
        namespaces and their pods, providing a clearer understanding of the
        overall policy structure.
      </p>

      <hr style="margin: 20px 0;" />

      <h2>Network Policy Table Description</h2>
      <p>
        This table provides detailed information about network policies. Each
        row represents a single policy with various details.
      </p>

      <h3>Table Columns:</h3>
      <ul>
        <li><strong>Name:</strong> The name of the policy.</li>
        <li>
          <strong>Namespace:</strong> The namespace where the policy is applied.
        </li>
        <li>
          <strong>Description:</strong> A brief description of the policy.
        </li>
        <li>
          <strong>Creation:</strong> Date and time when the policy was created.
        </li>
        <li><strong>Package:</strong> The associated package.</li>
        <li><strong>Generation:</strong> The policy generation number.</li>
        <li>
          <strong>Resource Version:</strong> The version of the policy resource.
        </li>
        <li>
          <strong>Ingress Ports:</strong> Allowed ports and protocols for ingress
          traffic (formatted as `port/protocol`).
        </li>
        <li>
          <strong>Egress Ports:</strong> Allowed ports and protocols for egress traffic
          (formatted as `port/protocol`).
        </li>
        <li>
          <strong>Ingress From:</strong> Sources allowed for ingress traffic, including
          namespace selectors, pod selectors, and IP blocks.
        </li>
        <li>
          <strong>Egress To:</strong> Destinations allowed for egress traffic, including
          namespace selectors, pod selectors, and IP blocks.
        </li>
        <li><strong>Policy UID:</strong> Unique identifier for the policy.</li>
        <li>
          <strong>Owner UID:</strong> Unique identifier for the owner of the policy.
        </li>
      </ul>

      <h3>Interactive Features:</h3>
      <ul>
        <li>
          The table allows vertical scrolling to view all policies if there are
          many.
        </li>
      </ul>

      <h3>How to Use:</h3>
      <ul>
        <li>
          Scroll through the table to view all policies and their details.
        </li>
        <li>
          Each row provides a comprehensive overview of a policy, including
          technical details and metadata.
        </li>
      </ul>

      <p>
        This table makes it easy to access and review detailed information about
        network policies within your system.
      </p>
    </div>
  </div>
{/if}

<style>
  .modal {
    display: block;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .modal-content {
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 700px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    text-align: left;
  }

  .close {
    background: none;
    border: none;
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }

  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
  }

  h2 {
    color: #333;
    font-size: 24px;
    margin-top: 0;
    margin-bottom: 10px;
  }

  h3 {
    color: #333;
    font-size: 20px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  p {
    color: #333;
    font-size: 16px;
    margin-top: 0;
    margin-bottom: 10px;
  }

  ul {
    list-style-type: disc;
    margin-left: 20px;
    color: #333;
  }

  ul ul {
    list-style-type: circle;
  }

  li {
    margin-bottom: 5px;
  }

  hr {
    border: 0;
    border-top: 1px solid #ddd;
    margin: 20px 0;
  }
</style>
