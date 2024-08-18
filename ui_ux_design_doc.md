# UI/UX Design Document

## Purpose and Scope

Project Liminality is a framework designed to enable users to create, organize, and share digital representations of ideas and stories in a natural, conversation-centric manner. By drawing from ancient storytelling traditions, the project aims to foster genuine human connections and understanding through a dialogos-centric approach. This document outlines the core features and user interface elements essential to realizing this vision.

## Feature List

### DreamNode
The DreamNode is the fundamental unit of Project Liminality, serving as a container for ideas, projects, or people. It is implemented as a Git repository, enabling version control, collaboration, and a local-first approach.

- **DreamTalk**
  - A minimalist, potentially animated SVG-based symbol representing an idea.
  - Serves as a visual shorthand for concepts, allowing for quick recognition and association.
  - Represents the "front side" of a DreamNode.

- **DreamSong**
  - A linear thread of DreamTalks, weaving multiple ideas into a larger narrative.
  - Provides detailed exploration of concepts, including text, images, or other media.
  - Represents the "back side" of a DreamNode, illustrating the relationships and context of the ideas.

- **DreamWeaving**
  - The process of connecting and combining DreamTalks into DreamSongs to form complex ideas or perspectives.
  - Involves creating new DreamNodes, modifying existing ones, and establishing links between them.
  - Enables the creation of higher-order ideas through recursive weaving.

### LiminalWeb
The LiminalWeb is the visual interface that presents the network of DreamNodes in a holarchical structure. It provides an intuitive, visually appealing way for users to explore and interact with their ideas.

- **Node Representation**
  - DreamNodes are depicted as circular elements containing DreamTalk symbols.
  - DreamNodes can represent either ideas or people
  - People hold ideas and ideas hold people
  - Selecting an idea shows all your friends that also hold this idea (StoryPlace)
  - Selecting a friend shows all ideas you share with this friend (MemeticMirror)


### CoherenceBeacon
The CoherenceBeacon is a mechanism that allows users to discover resonant ideas within their network by analyzing and comparing DreamNodes.

- **Activation and Analysis**
  - Every time a user weaves together two or more DreamTalks into a DreamSong it triggers the CoherenceBeacon
  - The mechanism identifies the user's friends who hold one or more of the respective input DreamNodes
  - The proposed DreamSong together with all input DreamNodes is sent out to the appropriate friends asynchronously
  - Each friend is invited to check out the DreamSong and if it resonates with them they accept it, thus both adding it to their set of DreamNodes as well as extending the signal in the same way laid out above

---

This condensed document focuses on the key features and their roles in achieving the overall vision of Project Liminality. It should provide a clear roadmap for implementing the UI/UX elements that are central to the app's functionality.