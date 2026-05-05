/**
 * Test script for the Blog Generation Endpoint
 */
async function testBlogGeneration() {
  const topic = "The Future of AI in Digital Art";
  console.log(`Generating blog post for: ${topic}...`);

  try {
    const response = await fetch('http://localhost:3000/api/admin/blog/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic,
        categoryId: 'general',
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Success! Created article:', data.article);
      console.log('Article ID:', data.articleId);
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testBlogGeneration();
