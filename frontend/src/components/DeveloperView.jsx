import React, { useState } from 'react';
import Avatar from './Avatar';
import {
  Code2,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Mail,
  Copy,
  Check,
  Crown,
  ShieldCheck,
  Activity,
  Zap,
  Globe
} from 'lucide-react';
import './DeveloperView.css';

// Clean inline SVGs for LinkedIn and GitHub
const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M5.07 18.5h2.78v-8.37H5.07v8.37z" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
  </svg>
);

export default function DeveloperView() {
  const [copiedEmail, setCopiedEmail] = useState(null);

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2400);
  };

  // Official Project Contributors (Lead Architect, Backend & Infrastructure, Operations & Field)
  const CONTRIBUTORS = [
    {
      name: 'Arin Gupta',
      role: 'Lead Architect & CV Systems',
      categoryBadge: 'CORE ARCHITECTURE & COMPUTER VISION',
      tagChip: 'Lead Architect',
      institution: 'Madhav Institute of Technology & Science (Deemed to be University), Gwalior',
      bio: 'Architects the core edge intelligence, deep learning YOLOv11 ANPR pipeline, and real-time boom barrier automation. Obsessed with sub-millisecond execution, tamper-proof user audit trails, and engineering fluid, zero-latency campus ingress systems.',
      pic: 'https://algo.mitsgwalior.in/assets/arin-8TawvVYl.png',
      stack: 'Edge Computer Vision & Core Architecture',
      skills: ['YOLOv11 ANPR', 'PyTorch & TensorRT', 'Sub-200ms Barrier Lift', 'Corridor Sweeper Engine', 'Real-Time Telemetry'],
      linkedin: 'https://www.linkedin.com/in/arin-gupta-2b94b032a/',
      github: 'https://github.com/arin-gupta06',
      email: '24cd10ar15@mitsgwl.ac.in',
      isHighlight: true,
      imgStyle: { objectPosition: 'center 15%' }
    },
    {
      name: 'Vivek Chaurasiya',
      role: 'Backend & Infrastructure Lead',
      categoryBadge: 'INFRASTRUCTURE & RUNTIME ENGINES',
      tagChip: 'Infrastructure Lead',
      institution: 'Madhav Institute of Technology & Science (Deemed to be University), Gwalior',
      bio: 'Engineers database architecture, FastAPI query optimization, asynchronous job queues, and automated barrier controller integration. Ensures the platform runs with high availability, low latency, and robust audit consistency across peak campus hours.',
      pic: 'https://algo.mitsgwalior.in/assets/vivek-zknvPYE4.png',
      stack: 'Backend & Data Pipelines',
      skills: ['FastAPI & Python', 'PostgreSQL & SQLite', 'Multi-Camera Sweeper', 'Redis Queue Cache', 'System Scalability'],
      linkedin: 'https://www.linkedin.com/in/vivek-chaurasiya-722037315',
      github: 'https://github.com/VivekChaurasiya95',
      email: 'vivekchaurasiya943@gmail.com',
      isHighlight: false,
      imgStyle: { objectPosition: 'center 20%' }
    },
    {
      name: 'Sarvesh Baghel',
      role: 'Field Operations & Deployment Lead',
      categoryBadge: 'FIELD OPERATIONS & HARDWARE DEPLOYMENT',
      tagChip: 'Operations Lead',
      institution: 'Madhav Institute of Technology & Science (Deemed to be University), Gwalior',
      bio: 'Oversees ground dataset validation, high-stress gate ingress testing, vehicle registry reconciliation, and hardware deployment workflows across campus barriers and surveillance checkpoints.',
      pic: '/assets/sarvesh.png',
      stack: 'Campus Operations & IoT Deployments',
      skills: ['Ground Ingress Validation', 'Hardware Deployment', 'Edge Stress Testing', 'Operations Logistics', 'Barrier Controllers'],
      linkedin: 'https://www.linkedin.com/in/sarvesh-baghel-b3a726274/',
      github: 'https://github.com/sarveshbaghel',
      email: 'sarveshsingh8462@gmail.com',
      isHighlight: false,
      imgStyle: { objectPosition: 'center 15%' }
    }
  ];

  const FACULTY_MENTOR = {
    name: 'Mr. Atul Chauhan',
    role: 'Faculty Mentor & Technical Advisor',
    categoryBadge: 'INSTITUTIONAL MENTORSHIP & TECHNICAL GUIDANCE',
    tagChip: 'Programmer of MITS DU',
    institution: 'Madhav Institute of Technology & Science (Deemed to be University), Gwalior',
    bio: 'Providing distinguished institutional mentorship, systems guidance, and architectural advisory for CampusGate at MITS DU. Inspires and steers student engineers to build high-throughput real-time platforms, develop disciplined computer vision and IoT problem-solving capabilities, and adhere to industry-standard software engineering benchmarks.',
    pic: 'https://algo.mitsgwalior.in/assets/atul-Du83MsIS.png',
    stack: 'Programmer of MITS DU',
    skills: ['Programmer of MITS DU', 'Institutional Guidance', 'Systems Engineering', 'Pedagogical Advisory', 'Competitive Programming Steering'],
    email: 'atul@mitsgwalior.in',
    imgStyle: { objectPosition: 'center 15%' }
  };

  return (
    <div className="developer-page">
      {/* Header Section */}
      <header className="developer-hero-header">
        <div className="developer-kicker-tag">
          <span className="kicker-dot" />
          <span>MITS Gwalior • Smart Ingress Engineering</span>
        </div>

        <h1 className="developer-hero-title">
          Engineering & Project Contributors
        </h1>

        <p className="developer-hero-desc">
          CampusGate is an intelligent deep-learning vehicle security platform designed and built at Madhav Institute of Technology & Science. 
          Powered by custom-hardened YOLOv11 ANPR, electronic boom barrier automation, and synchronized corridor handoff tracking.
        </p>
      </header>

      {/* 3-Column Core Architectural Team Grid */}
      <section className="developer-team-grid">
        {CONTRIBUTORS.map((c) => {
          const [imgFailed, setImgFailed] = useState(!c.pic);

          return (
            <article key={c.name} className="dev-profile-card">
              {/* Category Badge */}
              <div className={`card-header-badge ${c.isHighlight ? 'highlight' : ''}`}>
                {c.isHighlight ? <Crown size={12} /> : <Code2 size={12} />}
                <span>{c.categoryBadge}</span>
              </div>

              <div className="card-inner">
                {/* Clean Centered Avatar with Tag Chip */}
                <div className="card-avatar-wrap">
                  <div className="card-avatar-img-box">
                    {!imgFailed && c.pic ? (
                      <img
                        src={c.pic}
                        alt={c.name}
                        className="card-avatar-img"
                        style={c.imgStyle}
                        onError={() => setImgFailed(true)}
                      />
                    ) : (
                      <Avatar user={c} size={84} />
                    )}
                  </div>
                  <div className="card-tag-chip">
                    <span>{c.tagChip}</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="card-content">
                  <div className="card-title-row">
                    <div>
                      <h2 className="card-name">{c.name}</h2>
                      <div className="card-role-badge">
                        <Terminal size={13} />
                        <span>{c.role}</span>
                      </div>
                    </div>
                    <div className="card-tag-pill">{c.stack}</div>
                  </div>

                  <p className="card-institution">{c.institution}</p>
                  <p className="card-bio">{c.bio}</p>

                  <div className="card-skills-list">
                    {c.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  {/* Clean Action Buttons Aligned to Base */}
                  <div className="card-contact-actions">
                    {c.linkedin && (
                      <a
                        href={c.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="card-primary-btn"
                        title={`${c.name} on LinkedIn`}
                      >
                        <LinkedInIcon />
                        <span>LinkedIn</span>
                      </a>
                    )}

                    {c.github && (
                      <a
                        href={c.github}
                        target="_blank"
                        rel="noreferrer"
                        className="card-secondary-btn"
                        title={`${c.name} on GitHub`}
                      >
                        <GitHubIcon />
                        <span>GitHub</span>
                      </a>
                    )}

                    {c.email && !c.linkedin && (
                      <>
                        <a
                          href={`mailto:${c.email}`}
                          className="card-primary-btn"
                          title={`Email ${c.name}`}
                        >
                          <Mail size={14} />
                          <span>Contact</span>
                        </a>
                        <button
                          type="button"
                          className="card-secondary-btn"
                          onClick={() => handleCopyEmail(c.email)}
                          title="Copy email address"
                        >
                          {copiedEmail === c.email ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedEmail === c.email ? 'Copied' : 'Copy'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Faculty Mentor & Technical Advisor Dedicated Section */}
      <section className="faculty-mentor-card">
        <div className="card-header-badge highlight">
          <Crown size={12} />
          <span>{FACULTY_MENTOR.categoryBadge}</span>
        </div>

        <div className="card-inner">
          <div className="card-avatar-wrap">
            <div className="card-avatar-img-box">
              <img
                src={FACULTY_MENTOR.pic}
                alt={FACULTY_MENTOR.name}
                className="card-avatar-img"
                style={FACULTY_MENTOR.imgStyle}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="card-tag-chip">
              <span>{FACULTY_MENTOR.tagChip}</span>
            </div>
          </div>

          <div className="card-content">
            <div className="card-title-row">
              <div>
                <h2 className="card-name">{FACULTY_MENTOR.name}</h2>
                <div className="card-role-badge">
                  <ShieldCheck size={15} />
                  <span>{FACULTY_MENTOR.role}</span>
                </div>
              </div>
              <div className="card-tag-pill">{FACULTY_MENTOR.stack}</div>
            </div>

            <p className="card-institution">{FACULTY_MENTOR.institution}</p>
            <p className="card-bio">{FACULTY_MENTOR.bio}</p>

            <div className="card-skills-list">
              {FACULTY_MENTOR.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            <div className="card-contact-actions">
              <a
                href={`mailto:${FACULTY_MENTOR.email}`}
                className="card-primary-btn"
                title={`Send email to ${FACULTY_MENTOR.name}`}
              >
                <Mail size={14} />
                <span>{FACULTY_MENTOR.email}</span>
              </a>

              <button
                type="button"
                className="card-secondary-btn"
                onClick={() => handleCopyEmail(FACULTY_MENTOR.email)}
                title="Copy email address"
              >
                {copiedEmail === FACULTY_MENTOR.email ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedEmail === FACULTY_MENTOR.email ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
