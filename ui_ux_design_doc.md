# UI/UX Design Document

## Purpose and Scope

Project Liminality is designed to provide a framework that allows users to create digital representations of ideas and stories that human beings carry in their interior and wish to share with others. The vision of Project Liminality is to provide digital infrastructure that enables people to share ideas in the most natural way possible, drawing inspiration from our indigenous roots and ancient methods of sharing ideas around campfires through face-to-face, free-flowing conversations.

Project Liminality serves as a conversational co-pilot, centered around video calls or actual face-to-face conversations. It explores a dialogos-centric web, contrasting with the current monologos-centric internet, which is vulnerable to propaganda. The overarching goal is to return to a dialogos-centric approach while utilizing monologos to enhance the dialogos.

Key aspects of Project Liminality include:

1. Dreamnode Management: The fundamental unit of Project Liminality. Users can create, view, and interact with "dreamnodes," which represent individual ideas, projects, or persons. Each dreamnode is a self-contained entity that can be linked to other dreamnodes, forming a network of interconnected ideas.

2. Dream Talk and Dream Song: Each dreamnode has a front side (Dream Talk) and a back side (Dream Song). Dream Talk is a minimalist, potentially animated SVG-based symbol representing an idea. It serves as a visual shorthand for the concept, allowing for quick recognition and association. Dream Song is a linear thread of Dream Talks, weaving multiple ideas into a larger story. It provides a more detailed exploration of the concept, potentially including text, images, or other media that elaborate on the idea represented by the Dream Talk.

3. Visual Representation: The application presents dreamnodes in a visually appealing and intuitive interface, allowing users to see connections and relationships between different elements in a holarchical structure. This interface uses a force-directed graph layout, where dreamnodes are represented as nodes and their relationships as edges. Users can zoom in and out, drag nodes to rearrange the layout, and click on nodes to explore their contents.

4. Git-based Architecture: Each dreamnode is a Git repository, allowing for version control and collaboration. This architecture enables users to track changes over time, branch ideas, and merge different versions. Dream Songs can import Dream Talks from other dreamnodes using Git submodules, facilitating the reuse and combination of ideas across different contexts.

5. Person-Idea Relationship: Dreamnodes can represent either ideas or persons, allowing users to visualize shared vocabularies and connections between people and concepts. This feature enables the mapping of intellectual lineages, collaborative networks, and the evolution of ideas across different thinkers and communities.

6. Local and Agent-centric: Users maintain their own set of dreamnodes, representing their personal perspective and memetic horizon. This local-first approach ensures privacy and data ownership while allowing for selective sharing and collaboration. The agent-centric model means that each user's view of the idea network is unique, reflecting their personal understanding and connections.

7. Coherence Beacon: A mechanism for expanding one's idea network through resonant connections with friends. The coherence beacon works as follows:
   a. Users can "activate" their coherence beacon for specific dreamnodes.
   b. The system then analyzes the activated dreamnode's content and relationships.
   c. It compares this analysis with the dreamnodes of the user's friends (who have agreed to participate in coherence beacon sharing).
   d. The system identifies potentially resonant dreamnodes from friends' networks based on semantic similarity, shared references, or other relevant criteria.
   e. These potential connections are then presented to the user as suggestions for exploration, allowing them to discover new ideas and perspectives that align with their interests.

8. Dream Weaving: The process of playing with ideas and weaving them together into larger wholes. Dream weaving involves:
   a. Creating new dreamnodes or modifying existing ones.
   b. Establishing links between dreamnodes to form networks of related ideas.
   c. Combining multiple Dream Talks into a Dream Song to create a narrative or argument.
   d. Using the visual interface to rearrange and restructure idea networks, discovering new connections and insights.
   e. Collaborating with others by sharing dreamnodes, importing elements from shared repositories, or engaging in real-time co-editing sessions.

The scope of Project Liminality is to provide a comprehensive tool for anyone who wishes to organize, develop, and share complex ideas in a more natural, conversation-centric manner. It aims to bridge the gap between ancient storytelling traditions and modern digital capabilities, offering a unique, visually-driven approach to idea organization and development that fosters genuine human connection and understanding.
