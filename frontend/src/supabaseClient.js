import { createClient } from '@supabase/supabase-js';
import config from './config';

// Initialize Supabase Client
const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Singleton for Embedding Pipeline
let embeddingPipeline = null;

const getEmbeddingPipeline = async () => {
    if (!embeddingPipeline) {
        // Dynamic import to avoid SSR issues
        const { pipeline, env } = await import('@xenova/transformers');

        // Configuration to fix "Unexpected token <" error
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.useBrowserCache = false; // Force refresh to clear bad cache

        console.log("Transformers Env Configured:", {
            allowLocal: env.allowLocalModels,
            allowRemote: env.allowRemoteModels,
            useCache: env.useBrowserCache
        });

        // Use a small, efficient model for vectors
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embeddingPipeline;
};

/**
 * Generate embedding for text
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export const generateEmbedding = async (text) => {
    try {
        const pipe = await getEmbeddingPipeline();
        const output = await pipe(text, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);

        // Pad to 1536 if needed
        if (vector.length < 1536) {
            while (vector.length < 1536) {
                vector.push(0);
            }
        }
        return vector;
    } catch (error) {
        console.error('Embedding generation error:', error);
        return [];
    }
};

// ... (existing code)

/**
 * Save a conversation to Supabase
 * @param {Object} conversation - The conversation object
 */
export const saveConversationToSupabase = async (conversation) => {
    try {
        const { error } = await supabase
            .from('conversations')
            .upsert({
                id: conversation.id,
                title: conversation.title,
                messages: conversation.messages,
                is_pinned: conversation.isPinned,
                user_id: conversation.user_id,
                project_id: conversation.projectId || null, // Add project_id
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error saving conversation:', error);
        return { success: false, error };
    }
};

/**
 * Fetch all conversations from Supabase
 */
export const fetchConversationsFromSupabase = async (userId) => {
    try {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data.map(conv => ({
            id: conv.id,
            title: conv.title,
            messages: conv.messages,
            isPinned: conv.is_pinned,
            projectId: conv.project_id, // Map project_id
            timestamp: conv.updated_at
        }));
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
};

// ... (existing code)

/**
 * Delete a conversation
 */
export const deleteConversationFromSupabase = async (id) => {
    try {
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return { success: false, error };
    }
};

/**
 * Fetch projects from Supabase
 */
export const fetchProjectsFromSupabase = async (userId) => {
    try {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
};

/**
 * Create a new project
 */
export const createProjectInSupabase = async (project) => {
    try {
        const { error } = await supabase
            .from('projects')
            .insert([{
                id: project.id,
                user_id: project.user_id,
                name: project.name,
                icon: project.icon,
                color: project.color,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error creating project:', error);
        return { success: false, error };
    }
};

/**
 * Delete a project
 */
export const deleteProjectFromSupabase = async (id) => {
    try {
        // First, unlink conversations
        const { error: updateError } = await supabase
            .from('conversations')
            .update({ project_id: null })
            .eq('project_id', id);

        if (updateError) throw updateError;

        // Then delete project
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting project:', error);
        return { success: false, error };
    }
};

// ... (existing code)

/**
 * Upload a document and its embeddings
 * @param {File} file - The file object
 * @param {string} userId - The user ID
 * @param {Array<{content: string, embedding: number[]}>} sections - Document sections
 * @param {boolean} isShared - Whether this is a company-wide shared document
 */
export const uploadDocument = async (file, userId, sections, isShared = false) => {
    try {
        // 1. Insert document metadata
        const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert({
                name: file.name,
                user_id: userId,
                is_shared: isShared // Add shared flag
            })
            .select()
            .single();

        if (docError) throw docError;

        // 2. Prepare sections data
        const sectionsData = sections.map(section => ({
            document_id: docData.id,
            content: section.content,
            embedding: section.embedding
        }));

        if (sectionsData.length === 0) {
            console.warn("No sections to upload for document:", file.name);
            return { success: true, document: docData, warning: "Document empty" };
        }

        // 3. Insert sections (chunks) in batches to avoid 429/Payload Too Large errors
        const BATCH_SIZE = 50;
        for (let i = 0; i < sectionsData.length; i += BATCH_SIZE) {
            const batch = sectionsData.slice(i, i + BATCH_SIZE);
            const { error: sectionsError } = await supabase
                .from('document_sections')
                .insert(batch);

            if (sectionsError) throw sectionsError;
        }

        return { success: true, document: docData };
    } catch (error) {
        console.error('Error uploading document:', error);
        return { success: false, error };
    }
};

/**
 * DEBUG: List all documents to verify uploads
 */
export const debugListDocuments = async () => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("DEBUG: Error listing documents:", error);
            return;
        }
        console.log("DEBUG: All Documents in DB:", data);
        return data;
    } catch (e) { console.error(e); }
};

/**
 * DEBUG: Inspect specific document chunks
 */
export const debugInspectDocument = async (docId) => {
    try {
        const { data, error } = await supabase
            .from('document_sections')
            .select('content, embedding')
            .eq('document_id', docId)
            .limit(5);

        if (error) {
            console.error("DEBUG: Error inspecting document:", error);
            return;
        }
        console.log(`DEBUG: Chunks for ${docId}:`, data.map(d => ({
            content_preview: d.content.substring(0, 100),
            content_length: d.content.length,
            embedding_length: d.embedding ? d.embedding.length : 0
        })));
        return data;
    } catch (e) { console.error(e); }
};

/**
 * Search for personal documents using Vector Search
 * @param {string} query - Query text
 * @param {number} threshold - Similarity threshold (0-1)
 * @param {number} count - Number of results to return
 */
export const searchPersonalDocuments = async (query, threshold = 0.1, count = 5) => {
    try {
        const embedding = await generateEmbedding(query);

        if (!embedding || embedding.length === 0) return [];

        const { data, error } = await supabase.rpc('match_document_sections_v2', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: count,
            query_text: query  // Pass keyword query for hybrid search
        });

        if (error) {
            console.error("Error executing match_document_sections RPC:", error);
            throw error;
        }

        console.log(`Vector search found ${data ? data.length : 0} matches.`);
        if (data && data.length > 0) {
            console.log("RAG Matches:", data.map(d => `${d.document_name} (${(d.similarity * 100).toFixed(1)}%) [Shared: ${d.is_shared}]`));
        } else {
            console.log("RAG Matches: NONE");
        }
        return data;
    } catch (error) {
        console.error('Error searching personal documents:', error);
        return [];
    }
};

const cosineSimilarity = (a, b) => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        magnitudeA += a[i] * a[i];
        magnitudeB += b[i] * b[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    return dotProduct / (magnitudeA * magnitudeB);
};

export const debugCheckSimilarity = async (docId, queryText) => {
    try {
        console.log(`DEBUG: Checking similarity for Doc ${docId} vs Query: "${queryText}"`);

        // 1. Get Query Embedding
        const queryEmbedding = await generateEmbedding(queryText);
        console.log("DEBUG: Query Embedding Length:", queryEmbedding.length);
        console.log("DEBUG: Query Embedding Sample:", queryEmbedding.slice(0, 5));

        // 2. Get Doc Embedding (First Chunk)
        const { data, error } = await supabase
            .from('document_sections')
            .select('content, embedding')
            .eq('document_id', docId)
            .limit(1);

        if (error || !data || data.length === 0) {
            console.error("DEBUG: Could not fetch doc chunk:", error);
            return;
        }

        let docEmbedding = data[0].embedding;
        const docContent = data[0].content;

        // Parse if string
        if (typeof docEmbedding === 'string') {
            docEmbedding = JSON.parse(docEmbedding);
        }

        console.log("DEBUG: Doc Embedding Length:", docEmbedding ? docEmbedding.length : "NULL");
        console.log("DEBUG: Doc Content Preview:", docContent.substring(0, 50));

        if (!docEmbedding) {
            console.error("DEBUG: Doc embedding is NULL/Empty!");
            return;
        }

        // 3. Calculate Similarity
        // Note: pgvector <=> is cosine distance. 1 - distance = similarity.
        // We calculate cosine similarity directly here.
        const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
        console.log(`DEBUG: ------------------------------------------`);
        console.log(`DEBUG: CALCULATED SIMILARITY: ${(similarity * 100).toFixed(2)}%`);
        console.log(`DEBUG: ------------------------------------------`);

    } catch (e) { console.error(e); }
};

/**
 * Fetch specific document content by name (for direct file context)
 * @param {string} fileName 
 */
export const fetchDocumentByName = async (fileName) => {
    try {
        // 1. Find document ID
        const { data: docs, error: docError } = await supabase
            .from('documents')
            .select('id')
            .ilike('name', `%${fileName}%`) // Loose match
            .limit(1);

        if (docError || !docs || docs.length === 0) return null;

        const docId = docs[0].id;

        // 2. Fetch first few sections
        const { data: sections, error: sectionError } = await supabase
            .from('document_sections')
            .select('content')
            .eq('document_id', docId)
            .limit(5); // Return first 5 chunks for summary/overview

        if (sectionError) {
            console.error("Error fetching sections (RLS?):", sectionError);
            throw sectionError;
        }

        console.log(`Fetched ${sections.length} sections for document ${docId}`);
        return sections.map(s => s.content).join('\n\n');
    } catch (error) {
        console.error("Error fetching document content (fetchDocumentByName):", error);
        return null;
    }
};

// ... (existing searchVectors export - ensuring keep it at the end if needed)
export const searchVectors = async (query, threshold = 0.5, count = 5) => {
    try {
        let embedding;
        if (typeof query === 'string') {
            embedding = await generateEmbedding(query);
        } else {
            embedding = query;
        }

        if (!embedding || embedding.length === 0) {
            console.warn("Empty embedding generated");
            return [];
        }

        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: count
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error searching vectors:', error);
        return [];
    }
};

