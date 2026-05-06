import { getInitialServices } from '../src/core/container';

async function testFetch() {
  const services = getInitialServices();
  const slug = 'vaulting-asset-custodians-comparison';
  console.log(`Fetching post with slug: ${slug}`);
  
  const post = await services.knowledgebaseRepository.getArticleBySlug(slug);
  if (post) {
    console.log('Found post:', post.title);
  } else {
    console.log('Post not found!');
  }
}

testFetch().catch(console.error);
